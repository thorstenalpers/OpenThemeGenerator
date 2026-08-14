use std::process::Command;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

const KEYRING_SERVICE: &str = "com.thorstenalpers.openthemegenerator";
const KEYRING_ACCOUNT: &str = "anthropic-api-key";

const MODEL: &str = "claude-opus-5";
const MAX_TOKENS: u32 = 16000;
const API_URL: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2023-06-01";
/// Server-side fallbacks: when a safety classifier declines the request, the API re-runs it on a
/// substitute model instead of handing back an empty response.
const BETA_FALLBACK: &str = "server-side-fallback-2026-07-01";

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Source {
    /// The local `claude` binary. Nothing leaves the machine that the binary does not already send.
    #[default]
    Cli,
    /// api.anthropic.com, with the key in the Windows Credential Manager.
    Anthropic,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub source: Source,
    pub cli_available: bool,
    pub has_key: bool,
}

pub fn status(source: Source) -> Status {
    Status {
        source,
        cli_available: locate_cli().is_some(),
        has_key: entry().and_then(|e| e.get_password()).is_ok(),
    }
}

fn entry() -> keyring::Result<keyring::Entry> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
}

/// Stores the key where this app cannot read it back into the UI — only send it.
pub fn set_key(key: &str) -> AppResult<()> {
    let entry = entry().map_err(|error| AppError::Message(error.to_string()))?;
    if key.trim().is_empty() {
        let _ = entry.delete_credential();
        return Ok(());
    }
    entry
        .set_password(key.trim())
        .map_err(|error| AppError::Message(error.to_string()))
}

pub fn ask(source: Source, system: &str, prompt: &str) -> AppResult<String> {
    match source {
        Source::Cli => ask_cli(system, prompt),
        Source::Anthropic => ask_anthropic(system, prompt),
    }
}

/// Two probes because the name resolves differently per machine: an `.exe` runs directly, while a
/// `.cmd` shim does not — `Command::new` will not execute a shim, so that case needs `cmd /C`.
fn locate_cli() -> Option<Vec<String>> {
    let probe = |program: &str, args: &[&str]| {
        Command::new(program)
            .args(args)
            .arg("--version")
            .output()
            .ok()
            .filter(|output| output.status.success())
            .map(|_| {
                std::iter::once(program.to_string())
                    .chain(args.iter().map(|a| (*a).to_string()))
                    .collect::<Vec<_>>()
            })
    };

    #[cfg(windows)]
    {
        probe("claude", &[]).or_else(|| probe("cmd", &["/C", "claude"]))
    }
    #[cfg(not(windows))]
    {
        probe("claude", &[])
    }
}

fn ask_cli(system: &str, prompt: &str) -> AppResult<String> {
    let command = locate_cli().ok_or_else(|| {
        AppError::Message(
            "the `claude` binary is not on PATH — install Claude Code, or switch the assistant to \
             a hosted provider in Settings"
                .into(),
        )
    })?;

    let (program, leading) = command.split_first().expect("probe returned a program");
    let output = Command::new(program)
        .args(leading)
        .arg("-p")
        .arg(format!("{system}\n\n{prompt}"))
        .output()
        .map_err(|error| AppError::Message(format!("could not run `claude`: {error}")))?;

    if !output.status.success() {
        return Err(AppError::Message(format!(
            "`claude` exited with {}: {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn ask_anthropic(system: &str, prompt: &str) -> AppResult<String> {
    let key = entry()
        .and_then(|entry| entry.get_password())
        .map_err(|_| AppError::Message("no API key stored — add one in Settings".into()))?;

    let body = serde_json::json!({
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        // Thinking is on by default on this model and counts against max_tokens. A palette is a
        // bounded problem, so medium effort leaves room for the JSON rather than the deliberation.
        "output_config": { "effort": "medium" },
        "fallbacks": "default",
        "system": system,
        "messages": [{ "role": "user", "content": prompt }],
    });

    let response = reqwest::blocking::Client::new()
        .post(API_URL)
        .header("x-api-key", key)
        .header("anthropic-version", API_VERSION)
        .header("anthropic-beta", BETA_FALLBACK)
        .json(&body)
        .send()
        .map_err(|error| AppError::Message(error.to_string()))?;

    let status = response.status();
    let payload: serde_json::Value = response
        .json()
        .map_err(|error| AppError::Message(error.to_string()))?;

    if !status.is_success() {
        let message = payload
            .pointer("/error/message")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown error");
        return Err(AppError::Message(format!("{status}: {message}")));
    }

    // A safety classifier can decline the request: HTTP 200, no content, `stop_reason: refusal`.
    // Reading content[0] without this check yields an empty answer with no explanation.
    if payload.get("stop_reason").and_then(|v| v.as_str()) == Some("refusal") {
        return Err(AppError::Message(
            "the model declined this request; nothing was returned".into(),
        ));
    }

    let text = payload
        .get("content")
        .and_then(|content| content.as_array())
        .map(|blocks| {
            blocks
                .iter()
                .filter(|block| block.get("type").and_then(|t| t.as_str()) == Some("text"))
                .filter_map(|block| block.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_default();

    if text.trim().is_empty() {
        return Err(AppError::Message("the reply carried no text".into()));
    }
    Ok(text.trim().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The transport rather than the prompt. Ignored by default: it needs the binary installed and
    /// it spends a real request, neither of which belongs in a check that runs on every commit.
    ///
    /// `cargo test --manifest-path src-tauri/Cargo.toml -- --ignored the_local_binary_answers`
    #[test]
    #[ignore = "runs the real `claude` binary and spends a request"]
    fn the_local_binary_answers() {
        let located = locate_cli();
        assert!(located.is_some(), "`claude` is not on PATH");

        let reply = ask(
            Source::Cli,
            "You answer in one short sentence.",
            "What is 2 + 2?",
        )
        .expect("the binary should answer");

        // Non-empty and exited zero is the whole claim: that the process is found, run, and read
        // back. What the model says is not this test's business.
        assert!(!reply.trim().is_empty(), "the reply carried no text");
        println!("probe: {located:?}\nreply: {reply}");
    }
}
