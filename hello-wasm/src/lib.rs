extern crate wasm_bindgen;

use std::mem;

use image::{ImageBuffer, Rgba, Pixel, GenericImage, Rgb, GenericImageView, DynamicImage, ImageFormat};
use serde::{Deserialize, Serialize};
use serde_json::Result;
use serialimage::{DynamicSerialImage, ImageMetaData};
use wasm_bindgen::prelude::*;

pub mod console {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    extern {
        #[wasm_bindgen(js_namespace = console)]
        pub fn log(s: &str);
    }
}

pub fn hsl_exclude(
    pixels: Vec<Rgb<u8>>,
    sort_func: fn(&Rgb<u8>) -> f32,
    exclude_func: fn(&Rgb<u8>) -> f32,
    lower: f32,
    upper: f32,
) -> Vec<Vec<Rgb<u8>>> {
    let mut chunks: Vec<Vec<Rgb<u8>>> = vec![];

    let mut group = vec![];
    for i in pixels {
        // could store this; computed twice
        let val = exclude_func(&i);
        if val < lower || val > upper {
            group.sort_by_key(|i| (sort_func(i) * 100.0) as u32);
            group.push(i);
            chunks.push(group.clone());
            group.clear();
        } else {
            group.push(i);
        }
    }

    chunks
}

pub fn luminance(pixel: &Rgb<u8>) -> f32 {
    (pixel.0.iter().max().unwrap().to_owned() as f32 / 255.0
        + pixel.0.iter().min().unwrap().to_owned() as f32 / 255.0)
        / 2.0
}

pub fn saturation(pixel: &Rgb<u8>) -> f32 {
    let min = pixel.0.iter().min().unwrap().to_owned() as f32;
    let max = pixel.0.iter().max().unwrap().to_owned() as f32;

    // no saturation
    if min == max {
        return 0.0;
    }
    // different formula if luminance > 50%
    if (min + max) / 2.0 > 0.5 {
        (max - min) / (max + min)
    } else {
        (max - min) / (2.0 - max - min)
    }
}

pub fn hue(pixel: &Rgb<u8>) -> f32 {
    let min = pixel.0.iter().min().unwrap().to_owned() as i32;
    let max = pixel.0.iter().max().unwrap().to_owned() as i32;
    if max - min == 0 {
        return 0.0;
    }

    let r = pixel.0[0] as i32;
    let g = pixel.0[1] as i32;
    let b = pixel.0[2] as i32;

    let mut _hue: i32;
    if r == max {
        _hue = g - b / (max - min);
    } else if g == max {
        _hue = 2 + (b - r) / (max - min);
    } else {
        _hue = 4 + (b - g) / (max - min);
    }

    _hue *= 60;
    if _hue < 0 {
        _hue += 360;
    }
    (_hue / 360) as f32
}
#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn read_image(data: Vec<u8>) {
    let img = image::load_from_memory(&data).unwrap();
    console::log(&format!("Hello, {}!", img.width()));
    // Ok(())
}

#[wasm_bindgen]
pub fn alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    console::log(&format!("Allocated {} bytes", len));
    ptr
}

// #[wasm_bindgen]
// pub fn get_hsl_func(func_name: &str) -> fn(pixel: &Rgb<u8>) -> f32 {
//     match func_name {
//         "lightness" | "lightness_threshold" => luminance,
//         "saturation" | "saturation_threshold" => saturation,
//         "hue" | "hue_threshold" => hue,
//         _ => panic!("Unknown HSL function name: {}", func_name),
//     }
// }

#[wasm_bindgen]
// pub fn read_img(ptr: *mut u8, len: usize) -> Vec<u8> {
pub fn read_img(ptr: *mut u8, len: usize) -> String {
   let img = unsafe { Vec::from_raw_parts(ptr, len, len) };

    console::log(&format!("Reading image"));
    let source = match image::load_from_memory_with_format(&img, ImageFormat::Png) {
        Ok(i) => i,
        Err(e) => {
            console::log(&e.to_string());
            // return vec![];
            return "".to_string();
        }
    };

    console::log(&format!("Done reading image"));
    let dims = source.dimensions();
    let target = source.clone();
    // console::log(&format!("Cloned image"));

    // for x in 0..dims.0 {
    //     let mut col = vec![];
    //     for y in 0..dims.1 {
    //         let pixel = source.get_pixel(x, y).to_rgb();
    //         col.push(pixel);
    //     }

    //     let exclude_algorithm = "lightness_threshold";
    //     let sort_algorithm = "lightness";
    //     let lower_threshold = 0.2;
    //     let upper_threshold = 0.8;

    //     let grouped_cols = match exclude_algorithm {
    //         "lightness_threshold" | "saturation_threshold" | "hue_threshold" => hsl_exclude(
    //             col,
    //             saturation,
    //             hue,
    //             lower_threshold,
    //             upper_threshold,
    //         ),
    //         // "random_exclude" => random_exclude(
    //         //     col,
    //         //     get_hsl_func(cli.sort_algorithm.as_str()),
    //         //     cli.lower_threshold,
    //         //     cli.upper_threshold,
    //         // ),
    //         _ => panic!("Unknown pixel exclusion algorithm"),
    //     };
    //     for (c, i) in grouped_cols.concat().iter().enumerate() {
    //         target.put_pixel(x, c as u32, i.to_rgba())
    //     }
    // }

    // console::log(&format!("sorted image"));
    // // target = match cli.rotate {
    // //     0 => target,
    // //     90 => target.rotate270(),
    // //     180 => target.rotate180(),
    // //     270 => target.rotate90(),
    // //     _ => target,
    // // };
    // // target
    // //     .save("output.png")
    // //     .expect("Something went wrong with saving the file...");
    // // img.save("output.png").unwrap();


    // console::log(&format!("{:?}", target.height()));
    // source.to_rgb8().to_vec()
    let mut img = DynamicSerialImage::from(source);
    let imgstr = serde_json::to_string(&img).unwrap();
    imgstr
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    console::log(&format!("Hello, {}!", name));
    // alert(&format!("Hello, {}!", name));
}
