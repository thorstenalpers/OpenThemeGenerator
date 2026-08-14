use std::path::{Component, PathBuf};

use tauri::State;
use tauri_plugin_opener::OpenerExt;

use crate::assistant;
use crate::dto::{ExportFile, ProjectContext, Settings, WrittenFile};
use crate::error::{AppError, AppResult};
use crate::project;

pub struct AppState {
    pub config_dir: PathBuf,
}

impl AppState {
    fn settings_path(&self) -> PathBuf {
        self.config_dir.join("settings.json")
    }
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> AppResult<Settings> {
    match std::fs::read_to_string(state.settings_path()) {
        Ok(raw) => Ok(serde_json::from_str(&raw).unwrap_or_default()),
        Err(_) => Ok(Settings::default()),
    }
}

#[tauri::command]
pub fn set_settings(state: State<'_, AppState>, settings: Settings) -> AppResult<Settings> {
    std::fs::create_dir_all(&state.config_dir)?;
    std::fs::write(
        state.settings_path(),
        serde_json::to_string_pretty(&settings)?,
    )?;
    Ok(settings)
}

#[tauri::command]
pub fn assistant_status(source: assistant::Source) -> AppResult<assistant::Status> {
    Ok(assistant::status(source))
}

#[tauri::command]
pub fn assistant_set_key(key: String) -> AppResult<()> {
    assistant::set_key(&key)
}

#[tauri::command]
pub fn assistant_ask(
    source: assistant::Source,
    system: String,
    prompt: String,
) -> AppResult<String> {
    assistant::ask(source, &system, &prompt)
}

#[tauri::command]
pub fn project_scan(root: String) -> AppResult<ProjectContext> {
    project::scan(&root)
}

/// A relative path with no `..` and no root of its own. The exporter builds these names itself,
/// but they arrive over the same bridge as everything else — and this one writes to disk.
fn safe_relative(path: &str) -> AppResult<PathBuf> {
    let candidate = PathBuf::from(path.replace('\\', "/"));
    let allowed = candidate
        .components()
        .all(|component| matches!(component, Component::Normal(_)));

    if !allowed || candidate.as_os_str().is_empty() {
        return Err(AppError::Message(format!(
            "refusing to write outside the chosen folder: {path}"
        )));
    }
    Ok(candidate)
}

#[tauri::command]
pub fn export_write(directory: String, files: Vec<ExportFile>) -> AppResult<Vec<WrittenFile>> {
    let root = PathBuf::from(&directory);
    if !root.is_dir() {
        return Err(AppError::Message(format!("{directory} is not a folder")));
    }

    let mut written = Vec::new();
    for file in files {
        let target = root.join(safe_relative(&file.path)?);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&target, file.contents)?;
        written.push(WrittenFile {
            path: target.to_string_lossy().to_string(),
        });
    }
    Ok(written)
}

#[tauri::command]
pub fn reveal(app: tauri::AppHandle, path: String) -> AppResult<()> {
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|error| AppError::Message(error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_refuses_a_path_that_climbs_out_of_the_chosen_folder() {
        assert!(safe_relative("themes/azure.css").is_ok());
        assert!(safe_relative("../secrets.env").is_err());
        assert!(safe_relative("/etc/passwd").is_err());
        assert!(safe_relative("C:/Windows/system.ini").is_err());
        assert!(safe_relative("").is_err());
    }
}
