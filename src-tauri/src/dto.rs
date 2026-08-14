use serde::{Deserialize, Serialize};

use crate::assistant::Source;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub source: Source,
    /// Where the last export went, so the next one opens there.
    #[serde(default)]
    pub export_directory: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            source: Source::Cli,
            export_directory: None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectFile {
    /// Relative to the scanned root, with forward slashes on every platform.
    pub path: String,
    pub bytes: u64,
    pub excerpt: String,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectContext {
    pub root: String,
    pub files: Vec<ProjectFile>,
    /// What the scan concluded about the stack, in one line for the prompt.
    pub stack: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ExportFile {
    pub path: String,
    pub contents: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct WrittenFile {
    pub path: String,
}
