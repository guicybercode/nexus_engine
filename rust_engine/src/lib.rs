use rustler::{Env, Term, NifResult, Encoder};
use rustler::resource::ResourceArc;
use std::sync::Mutex;
use serde_json;

mod physics;
mod lua_engine;

use physics::{Action, ActionResult, Player};
use lua_engine::LuaEngine;

rustler::init!("Elixir.ProjectElixirRustLua.RustNif", [process_player_action, init_lua_engine]);

struct LuaEngineResource {
    engine: Mutex<LuaEngine>,
}

static mut LUA_ENGINE: Option<ResourceArc<LuaEngineResource>> = None;

#[rustler::nif]
fn init_lua_engine(env: Env) -> NifResult<Term> {
    let engine = LuaEngine::new()
        .map_err(|e| rustler::Error::Term(Box::new(format!("Lua init error: {}", e))))?;
    
    let resource = ResourceArc::new(LuaEngineResource {
        engine: Mutex::new(engine),
    });
    
    unsafe {
        LUA_ENGINE = Some(resource.clone());
    }
    
    if let Ok(mut engine_guard) = resource.engine.lock() {
        let script_path = "lua_scripts/movement_rules.lua";
        if std::path::Path::new(script_path).exists() {
            if let Err(e) = engine_guard.load_script(script_path) {
                return Err(rustler::Error::Term(Box::new(format!("Script load error: {}", e))));
            }
        }
    }
    
    Ok(true.encode(env))
}

#[rustler::nif]
fn process_player_action(action_json: String) -> NifResult<String> {
    let action: Action = serde_json::from_str(&action_json)
        .map_err(|e| rustler::Error::Term(Box::new(format!("JSON parse error: {}", e))))?;
    
    let mut player = Player::new(action.player_id.clone());
    
    let mut result = physics::process_physics(&action, &mut player);
    
    unsafe {
        if let Some(ref engine_resource) = LUA_ENGINE {
            if let Ok(mut engine_guard) = engine_resource.engine.lock() {
                let player_json = serde_json::json!({
                    "id": player.id,
                    "position": {
                        "x": player.position.x,
                        "y": player.position.y
                    },
                    "velocity": {
                        "x": player.velocity.x,
                        "y": player.velocity.y
                    },
                    "speed": player.speed
                });
                
                let player_str = serde_json::to_string(&player_json)
                    .map_err(|e| rustler::Error::Term(Box::new(format!("JSON stringify error: {}", e))))?;
                
                match engine_guard.apply_custom_rules(&action.action, &player_str) {
                    Ok(modified_player_str) => {
                        if let Ok(modified_player) = serde_json::from_str::<serde_json::Value>(&modified_player_str) {
                            if let Some(pos) = modified_player.get("position") {
                                if let Some(x) = pos.get("x").and_then(|v| v.as_f64()) {
                                    result.position.x = x;
                                }
                                if let Some(y) = pos.get("y").and_then(|v| v.as_f64()) {
                                    result.position.y = y;
                                }
                            }
                            if let Some(vel) = modified_player.get("velocity") {
                                if let Some(x) = vel.get("x").and_then(|v| v.as_f64()) {
                                    result.velocity.x = x;
                                }
                                if let Some(y) = vel.get("y").and_then(|v| v.as_f64()) {
                                    result.velocity.y = y;
                                }
                            }
                            if let Some(speed) = modified_player.get("speed").and_then(|v| v.as_f64()) {
                                player.speed = speed;
                            }
                        }
                    }
                    Err(e) => {
                        result.message = format!("Lua error: {}", e);
                    }
                }
            }
        }
    }
    
    let result_json = serde_json::to_string(&result)
        .map_err(|e| rustler::Error::Term(Box::new(format!("JSON stringify error: {}", e))))?;
    
    Ok(result_json)
}

