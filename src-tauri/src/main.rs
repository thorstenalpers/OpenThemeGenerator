// The console window is Windows-only noise for a GUI app, and only in release: a debug build keeps
// it so `println!` and panics have somewhere to go.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    openthemegenerator_lib::run()
}
