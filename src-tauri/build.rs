fn main() {
    // The window and taskbar icon is a resource compiled into the executable, but `tauri_build`
    // only asks cargo to watch `tauri.conf.json` and `capabilities`. Regenerating the icons leaves
    // every byte cargo knows about untouched, so it reuses the binary and the old icon survives
    // every rebuild until something else forces a relink.
    println!("cargo:rerun-if-changed=icons");
    tauri_build::build()
}
