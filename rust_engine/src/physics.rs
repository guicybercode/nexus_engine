use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vector2 {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub position: Vector2,
    pub velocity: Vector2,
    pub speed: f64,
}

impl Player {
    pub fn new(id: String) -> Self {
        Player {
            id,
            position: Vector2 { x: 0.0, y: 0.0 },
            velocity: Vector2 { x: 0.0, y: 0.0 },
            speed: 5.0,
        }
    }

    pub fn update(&mut self, delta_time: f64) {
        self.position.x += self.velocity.x * delta_time;
        self.position.y += self.velocity.y * delta_time;
        
        self.velocity.x *= 0.9;
        self.velocity.y *= 0.9;
    }

    pub fn apply_force(&mut self, direction: &str, force: f64) {
        match direction {
            "up" => self.velocity.y -= force,
            "down" => self.velocity.y += force,
            "left" => self.velocity.x -= force,
            "right" => self.velocity.x += force,
            _ => {}
        }
    }

    pub fn apply_speed_modifier(&mut self, modifier: f64) {
        self.speed *= modifier;
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Action {
    pub action: String,
    pub direction: Option<String>,
    pub player_id: String,
    pub force: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionResult {
    pub player_id: String,
    pub position: Vector2,
    pub velocity: Vector2,
    pub success: bool,
    pub message: String,
}

pub fn process_physics(action: &Action, player: &mut Player) -> ActionResult {
    let delta_time = 0.016;
    
    match action.action.as_str() {
        "move" => {
            if let Some(dir) = &action.direction {
                let force = action.force.unwrap_or(player.speed);
                player.apply_force(dir, force);
            }
        }
        "jump" => {
            player.apply_force("up", player.speed * 1.5);
        }
        _ => {}
    }
    
    player.update(delta_time);
    
    ActionResult {
        player_id: player.id.clone(),
        position: player.position.clone(),
        velocity: player.velocity.clone(),
        success: true,
        message: format!("Action {} processed", action.action),
    }
}

