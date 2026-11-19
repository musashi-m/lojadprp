fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'Distrito Paulista RP'
description 'Sistema de Entrega Automatica - Loja Oficial'
version '1.0.0'

server_scripts {
    '@oxmysql/lib/MySQL.lua', -- opcional se usar banco direto
    'config.lua',
    'server/main.lua'
}

