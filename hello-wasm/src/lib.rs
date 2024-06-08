extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

pub mod console {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    extern {
        #[wasm_bindgen(js_namespace = console)]
        pub fn log(s: &str);
    }
}

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub extern fn greet(name: &str) {
    console::log(&format!("Hello, {}!", name));
    alert(&format!("Hello, {}!", name));
}
