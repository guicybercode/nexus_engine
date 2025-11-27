use mlua::prelude::*;
use serde_json;

pub struct LuaEngine {
    lua: Lua,
}

impl LuaEngine {
    pub fn new() -> Result<Self, LuaError> {
        let lua = Lua::new();
        let engine = LuaEngine {
            lua,
        };
        engine.init_globals()?;
        Ok(engine)
    }

    fn init_globals(&self) -> Result<(), LuaError> {
        let globals = self.lua.globals();
        
        let apply_custom_rule = self.lua.create_function(|_, (action, player_data): (String, String)| {
            let mut player: serde_json::Value = serde_json::from_str(&player_data)
                .map_err(|e| LuaError::RuntimeError(format!("JSON parse error: {}", e)))?;
            
            if let Some(obj) = player.as_object_mut() {
                if action == "move" {
                    if let Some(speed) = obj.get_mut("speed") {
                        if let Some(speed_val) = speed.as_f64() {
                            *speed = serde_json::json!(speed_val * 1.2);
                        }
                    }
                } else if action == "jump" {
                    if let Some(vel) = obj.get_mut("velocity") {
                        if let Some(vel_obj) = vel.as_object_mut() {
                            if let Some(y) = vel_obj.get_mut("y") {
                                if let Some(y_val) = y.as_f64() {
                                    *y = serde_json::json!(y_val * 1.3);
                                }
                            }
                        }
                    }
                }
            }
            
            Ok(serde_json::to_string(&player)
                .map_err(|e| LuaError::RuntimeError(format!("JSON stringify error: {}", e)))?)
        })?;
        
        globals.set("apply_custom_rule", apply_custom_rule)?;
        
        Ok(())
    }

    pub fn load_script(&self, script_path: &str) -> Result<(), LuaError> {
        let script_content = std::fs::read_to_string(script_path)
            .map_err(|e| LuaError::RuntimeError(format!("Failed to read script: {}", e)))?;
        self.lua.load(&script_content).exec()?;
        Ok(())
    }

    pub fn apply_custom_rules(&self, action: &str, player_data: &str) -> Result<String, LuaError> {
        let globals = self.lua.globals();
        
        let apply_custom_rule: LuaFunction = globals.get("apply_custom_rule")?;
        let result: String = apply_custom_rule.call((action.to_string(), player_data.to_string()))?;
        
        Ok(result)
    }

    pub fn call_lua_function(&self, func_name: &str, args: Vec<f64>) -> Result<f64, LuaError> {
        let globals = self.lua.globals();
        let func: LuaFunction = globals.get(func_name)?;
        let result: f64 = func.call(args)?;
        Ok(result)
    }
}

impl Default for LuaEngine {
    fn default() -> Self {
        Self::new().expect("Failed to initialize Lua engine")
    }
}

