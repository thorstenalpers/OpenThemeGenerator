use std::path::{Path, PathBuf};

use crate::dto::{ProjectContext, ProjectFile};
use crate::error::{AppError, AppResult};

/// Folders whose contents are either generated, vendored, or enormous. Walking them is how a scan
/// turns into a minute of disk I/O for files nothing will read.
const SKIP: &[&str] = &[
    "node_modules",
    "target",
    ".git",
    ".svelte-kit",
    ".next",
    ".nuxt",
    ".vite",
    "build",
    "dist",
    "out",
    "coverage",
    "vendor",
    "bin",
    "obj",
];

/// The files that actually say what a project's colours are and how it declares them.
const WANTED: &[&str] = &[
    "components.json",
    "package.json",
    "app.css",
    "themes.css",
    "theme.css",
    "globals.css",
    "global.css",
    "index.css",
    "styles.css",
    "main.css",
    "tokens.css",
    "variables.css",
];

const WANTED_PREFIXES: &[&str] = &["tailwind.config.", "uno.config."];

const MAX_DEPTH: usize = 4;
const MAX_FILES: usize = 14;
const MAX_EXCERPT: usize = 6_000;
const MAX_TOTAL: usize = 48_000;

/// How much of a component is read while deciding whether its styles are worth carrying.
const SNIFF: usize = 20_000;

fn is_stylesheet(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.ends_with(".css") || lower.ends_with(".scss")
}

/// A component that paints something, in a project that keeps no stylesheet at all.
///
/// Most Svelte projects are not shadcn projects. They have no `app.css` full of custom properties —
/// their colours live in `<style>` blocks next to the markup, and a scan that only knows a dozen
/// filenames comes back with a `package.json` and nothing to read. Reading the file to decide is
/// the point: a component with no style block, or one that sets no colour, is not worth a slot.
fn paints(path: &Path) -> bool {
    let Ok(raw) = std::fs::read_to_string(path) else {
        return false;
    };
    let head = &raw[..cut(&raw, SNIFF)];
    let Some(start) = head.find("<style") else {
        return false;
    };
    let styles = &head[start..];

    ["#", "rgb", "hsl", "oklch", "var(--", "color:", "background"]
        .iter()
        .any(|marker| styles.contains(marker))
}

fn is_wanted(path: &Path, name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    WANTED.contains(&lower.as_str())
        || WANTED_PREFIXES
            .iter()
            .any(|prefix| lower.starts_with(prefix))
        || is_stylesheet(&lower)
        || (lower.ends_with(".svelte") && paints(path))
}

/// Named stylesheets first, then any other, then the manifests, then components.
///
/// The order is what the byte budget cuts against: an `app.css` that declares the tokens is worth
/// more than a dependency list, and a dependency list is worth more than the fourth component that
/// happens to set a border colour.
fn rank(name: &str) -> u8 {
    let lower = name.to_ascii_lowercase();
    if WANTED.contains(&lower.as_str()) && is_stylesheet(&lower) {
        0
    } else if is_stylesheet(&lower) {
        1
    } else if lower == "components.json" {
        2
    } else if lower.starts_with("tailwind.config.") || lower.starts_with("uno.config.") {
        3
    } else if lower == "package.json" {
        4
    } else {
        5
    }
}

fn collect(current: &Path, depth: usize, found: &mut Vec<PathBuf>) {
    if depth > MAX_DEPTH {
        return;
    }
    let Ok(entries) = std::fs::read_dir(current) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };

        if path.is_dir() {
            // Every dot-folder is skipped, not just the build output. `.claude` in particular can
            // hold a git worktree of the whole project, and scanning that reads the same tokens a
            // second time under a different path — half the prompt budget spent on a copy.
            if !name.starts_with('.') && !SKIP.contains(&name) {
                collect(&path, depth + 1, found);
            }
        } else if is_wanted(&path, name) {
            found.push(path);
        }
    }
}

/// One line about the stack, in the words the prompt needs: which framework, which Tailwind, and
/// whether the project already speaks OKLCH.
fn describe(files: &[ProjectFile]) -> String {
    let joined = files
        .iter()
        .map(|file| file.excerpt.as_str())
        .collect::<Vec<_>>()
        .join("\n");

    let mut notes: Vec<&str> = Vec::new();

    if files.iter().any(|f| f.path.ends_with("components.json")) {
        notes.push("shadcn is installed (components.json present)");
    }
    if joined.contains("@sveltejs/kit") || joined.contains("\"svelte\"") {
        notes.push("SvelteKit / Svelte");
    } else if joined.contains("\"next\"") {
        notes.push("Next.js");
    } else if joined.contains("\"react\"") {
        notes.push("React");
    } else if joined.contains("\"nuxt\"") || joined.contains("\"vue\"") {
        notes.push("Vue / Nuxt");
    }
    if joined.contains("@import 'tailwindcss'") || joined.contains("@import \"tailwindcss\"") {
        notes.push("Tailwind v4 (@import 'tailwindcss')");
    } else if joined.contains("@tailwind base") {
        notes.push("Tailwind v3 (@tailwind directives)");
    }
    if joined.contains("@theme inline") {
        notes.push("tokens are mapped with @theme inline");
    }
    if joined.contains("oklch(") {
        notes.push("existing tokens are written in OKLCH");
    } else if joined.contains("hsl(var(--") {
        notes.push("existing tokens are HSL channels behind hsl(var(--token))");
    }

    // Only when there is genuinely nothing else: components turn up beside a stylesheet often
    // enough, and saying the colours live in them when an app.css is right there is a lie the
    // assistant would then design around.
    let has_stylesheet = files
        .iter()
        .any(|file| is_stylesheet(&file.path.to_ascii_lowercase()));
    if !has_stylesheet && files.iter().any(|file| file.path.ends_with(".svelte")) {
        notes.push("no shared stylesheet — the colours are in the components' own style blocks");
    }

    if notes.is_empty() {
        "No stack markers were found in the scanned files.".to_string()
    } else {
        format!("Detected: {}.", notes.join("; "))
    }
}

/// Where to cut a file to keep it under `cap` bytes: the whole string when it already fits, and
/// otherwise the last char boundary at or below the cap — slicing mid-character panics.
fn cut(raw: &str, cap: usize) -> usize {
    if raw.len() <= cap {
        return raw.len();
    }
    let mut end = cap;
    while end > 0 && !raw.is_char_boundary(end) {
        end -= 1;
    }
    end
}

pub fn scan(root: &str) -> AppResult<ProjectContext> {
    let base = PathBuf::from(root);
    if !base.is_dir() {
        return Err(AppError::Message(format!("{root} is not a folder")));
    }

    let mut found = Vec::new();
    collect(&base, 0, &mut found);
    found.sort_by_key(|path| {
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default()
            .to_string();
        (rank(&name), path.components().count(), name)
    });

    let mut files = Vec::new();
    let mut budget = MAX_TOTAL;

    for path in found.into_iter().take(MAX_FILES) {
        let Ok(raw) = std::fs::read_to_string(&path) else {
            continue;
        };
        let bytes = raw.len() as u64;
        let cap = MAX_EXCERPT.min(budget);
        if cap == 0 {
            break;
        }

        let end = cut(&raw, cap);
        let truncated = end < raw.len();
        let excerpt = raw[..end].to_string();
        budget -= excerpt.len();

        files.push(ProjectFile {
            path: path
                .strip_prefix(&base)
                .unwrap_or(&path)
                .to_string_lossy()
                .replace('\\', "/"),
            bytes,
            excerpt,
            truncated,
        });
    }

    let stack = describe(&files);
    Ok(ProjectContext {
        root: root.to_string(),
        files,
        stack,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_names_the_stack_from_what_it_read() {
        let files = vec![
            ProjectFile {
                path: "components.json".into(),
                bytes: 10,
                excerpt: "{}".into(),
                truncated: false,
            },
            ProjectFile {
                path: "src/app.css".into(),
                bytes: 10,
                excerpt: "@import 'tailwindcss';\n:root{--background:oklch(1 0 0)}".into(),
                truncated: false,
            },
        ];

        let described = describe(&files);

        assert!(described.contains("shadcn"));
        assert!(described.contains("Tailwind v4"));
        assert!(described.contains("OKLCH"));
    }

    #[test]
    fn it_says_so_rather_than_guessing_when_nothing_matched() {
        assert!(describe(&[]).starts_with("No stack markers"));
    }

    #[test]
    fn a_file_under_the_cap_is_carried_whole() {
        // The off-by-one this guards is invisible in the excerpt and loud in the prompt: it drops
        // the closing brace of every JSON file and marks a 300-byte manifest as truncated.
        let raw = "{ \"style\": \"new-york\" }";
        assert_eq!(cut(raw, 6_000), raw.len());
        assert_eq!(&raw[..cut(raw, 6_000)], raw);
    }

    #[test]
    fn a_long_file_is_cut_on_a_character_boundary() {
        let raw = "ä".repeat(100); // two bytes per character
        let end = cut(&raw, 51);

        assert_eq!(end, 50);
        assert!(raw.is_char_boundary(end));
        assert!(end < raw.len());
    }

    #[test]
    fn stylesheets_outrank_manifests_so_the_cap_drops_the_manifest() {
        assert!(rank("app.css") < rank("components.json"));
        assert!(rank("components.json") < rank("package.json"));
    }

    /// The walker against a real tree, using this repository as the fixture — it is a SvelteKit
    /// app with shadcn and Tailwind v4, which is exactly the shape the scan exists to recognise,
    /// and it is always present wherever the tests run.
    #[test]
    fn it_finds_the_token_files_in_a_real_project_and_skips_the_generated_ones() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("the crate sits inside the repository")
            .to_path_buf();

        let scanned = scan(&root.to_string_lossy()).expect("the repository is a folder");
        let paths: Vec<&str> = scanned.files.iter().map(|f| f.path.as_str()).collect();

        assert!(paths.contains(&"src/app.css"), "{paths:?}");
        assert!(paths.contains(&"components.json"), "{paths:?}");
        assert!(
            paths.iter().all(|path| !path.starts_with("node_modules/")),
            "the walker entered a folder it was told to skip: {paths:?}"
        );
        assert!(scanned.files.len() <= MAX_FILES);

        assert!(scanned.stack.contains("shadcn"), "{}", scanned.stack);
        assert!(scanned.stack.contains("Tailwind v4"), "{}", scanned.stack);
        assert!(scanned.stack.contains("OKLCH"), "{}", scanned.stack);

        // The prompt has a budget, and a scan that quietly blows it is how a request gets rejected
        // three layers later with an unhelpful message.
        let total: usize = scanned.files.iter().map(|f| f.excerpt.len()).sum();
        assert!(total <= MAX_TOTAL, "{total} bytes");
    }

    #[test]
    fn a_worktree_under_a_dot_folder_is_not_read_a_second_time() {
        let root = std::env::temp_dir().join("otg-scan-fixture");
        let _ = std::fs::remove_dir_all(&root);
        let write = |relative: &str, contents: &str| {
            let path = root.join(relative);
            std::fs::create_dir_all(path.parent().expect("a parent")).expect("mkdir");
            std::fs::write(path, contents).expect("write");
        };

        write("src/app.css", "@import 'tailwindcss';");
        write("components.json", "{}");
        write(
            ".claude/worktrees/copy/src/app.css",
            "@import 'tailwindcss';",
        );
        write(".claude/skills/vendored/package.json", "{}");
        write("node_modules/some-package/package.json", "{}");

        let scanned = scan(&root.to_string_lossy()).expect("the fixture is a folder");
        let paths: Vec<&str> = scanned.files.iter().map(|f| f.path.as_str()).collect();

        let _ = std::fs::remove_dir_all(&root);
        assert_eq!(paths, vec!["src/app.css", "components.json"]);
    }

    /// Prints what the assistant would be shown for a project, without attaching it in the app.
    /// Ignored by default: it reads a folder that only exists on the machine running it.
    ///
    /// `OTG_SCAN_PATH=C:/Sources/OpenExamTrainer cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture what_the_assistant_would_see`
    #[test]
    #[ignore = "reads a folder outside this repository"]
    fn what_the_assistant_would_see() {
        let root = std::env::var("OTG_SCAN_PATH").expect("set OTG_SCAN_PATH to a project folder");
        let scanned = scan(&root).expect("the path should be a folder");

        println!("{}\n{}", scanned.root, scanned.stack);
        for file in &scanned.files {
            println!(
                "  {:<40} {:>7} bytes{}",
                file.path,
                file.bytes,
                if file.truncated { " (truncated)" } else { "" }
            );
        }
        assert!(!scanned.files.is_empty(), "nothing in {root} was readable");
    }
}
