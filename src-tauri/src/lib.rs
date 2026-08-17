mod assistant;
mod commands;
mod dto;
mod error;
mod project;

use tauri::Manager;

use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // Desktop only: the updater replaces an installed binary, which is not a thing a mobile
        // target does, and the plugin does not build for one.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let config_dir = app.handle().path().app_config_dir()?;
            app.manage(AppState { config_dir });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::set_settings,
            commands::assistant_status,
            commands::assistant_set_key,
            commands::assistant_ask,
            commands::project_scan,
            commands::export_write,
            commands::reveal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenThemeGenerator");
}
