"""Shared source/runtime folder conventions used by art exporters and checks."""
from pathlib import Path

SOURCE_FILES = {
    'player_cyborg_v1.png':'characters/player_cyborg_v1.png',
    'cyborg_combat_v1.png':'characters/cyborg_combat_v1.png',
    'patrol_combat_v1.png':'characters/patrol_combat_v1.png',
    'npc_engineer_v1.png':'characters/npc_engineer_v1.png',
    'npc_archivist_v1.png':'characters/npc_archivist_v1.png',
    'terrain_v1.png':'environment/terrain_v1.png',
    'world_decor_v1.png':'environment/world_decor_v1.png',
    'logic_devices_v1.png':'props/logic_devices_v1.png',
    'quest_props_v1.png':'props/quest_props_v1.png',
    'ui_icons_v1.png':'ui/ui_icons_v1.png',
    'ui_panels_v1.png':'ui/ui_panels_v1.png',
    'ui_icons_v2.png':'ui/ui_icons_v2.png',
    'vfx_v1.png':'effects/vfx_v1.png',
    'pulse_rifle_v1.png':'weapons/pulse_rifle_v1.png',
}
TILES={'lab_floor','wall_panel','copper_panel','glass_panel','hazard_tile','gantry_tile'}

def directory(name):
    if name.startswith('cyborg_'):return 'characters/cyborg'
    if name.startswith('patrol_') or name=='patrol':return 'characters/patrol'
    if name.startswith('rifle_') or name.startswith('muzzle_'):return 'weapons/pulse-rifle'
    if name.startswith('ui_'):return 'ui'
    if name in TILES:return 'environment/tiles'
    if name=='pulse':return 'effects'
    return 'environment/props'

def output_file(root,name):
    result=root/directory(name)/(name+'.png')
    result.parent.mkdir(parents=True,exist_ok=True)
    return result
