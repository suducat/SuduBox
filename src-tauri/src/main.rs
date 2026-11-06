#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Keep this identifier stable across updates: it owns WKWebView's
            // persistent IndexedDB/localStorage store (macOS 14+).
            tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                .data_store_identifier([83, 117, 100, 117, 66, 111, 120, 1, 145, 42, 37, 102, 18, 89, 11, 7])
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("速度工具箱启动失败");
}
