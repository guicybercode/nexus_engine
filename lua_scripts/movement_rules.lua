function calculate_speed_modifier(base_speed, player_level)
    return base_speed * (1 + player_level * 0.1)
end

function apply_jump_boost(velocity_y, boost_factor)
    return velocity_y * boost_factor
end

function check_special_ability(player_id, ability_type)
    if ability_type == "speed_boost" then
        return 1.5
    elseif ability_type == "jump_boost" then
        return 1.3
    else
        return 1.0
    end
end

