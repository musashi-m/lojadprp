Config = {}

-- URL onde a sua loja Next.js está rodando (mesma VPS = http://127.0.0.1:3000)
Config.ApiUrl = "http://127.0.0.1:3000"

-- Chave secreta de autenticação entre o FiveM e a Loja Web
-- DEVE SER A MESMA definida no .env.local da loja (FIVEM_API_SECRET)
Config.ApiSecret = "dprp_fivem_secret_change_me_in_prod"

-- Intervalo de checagem de novas compras em segundos (padrão: 10 segundos)
Config.PollInterval = 10

-- Webhook do Discord para logs de entrega da Staff (opcional)
Config.DiscordWebhook = ""

-- Sistema de notificação individual para o comprador ('ox_lib' ou 'chat')
Config.NotifySystem = 'ox_lib'

-- ==============================================================
-- Notificação Global de Compras da Loja (Para toda a cidade)
-- ==============================================================
-- Se ativado, exibe um anúncio para todos os jogadores online quando alguém compra na loja
Config.BroadcastPurchase = true

-- Onde exibir a notificação para a cidade:
-- 'both'   : Exibe no Chat com design estilizado E via ox_lib no canto superior esquerdo (Recomendado)
-- 'chat'   : Apenas no Chat estilizado (canto superior esquerdo da tela)
-- 'ox_lib' : Apenas card ox_lib (canto superior esquerdo da tela)
Config.BroadcastType = 'both'

-- Duração do alerta do ox_lib em milissegundos (padrão: 9000ms = 9s)
Config.BroadcastDuration = 9000

-- Mensagem base (suporta {player} e {product})
Config.BroadcastMessage = "{player} adquiriu {product} na nossa loja!"

-- Mapeamento de Entrega por Categoria de Produto
Config.Categories = {
    ['coins'] = function(targetSrc, citizenId, item)
        -- Quantidade de coins definida pelo slug (ex: '30-coins' -> 30)
        local amount = tonumber(item.productSlug:match("(%d+)")) or 1
        
        if targetSrc then
            -- Jogador Online: Adiciona ao inventário ox_inventory ou qbx metadata
            local success = exports.ox_inventory:AddItem(targetSrc, 'coin', amount)
            if not success then
                -- Fallback se o inventário falhar: adiciona via SQL
                MySQL.query.await("UPDATE players SET coins = coins + ? WHERE citizenid = ?", { amount, citizenId })
            end
        else
            -- Jogador Offline: Salva direto no banco de dados para quando logar
            MySQL.query.await("UPDATE players SET coins = coins + ? WHERE citizenid = ?", { amount, citizenId })
        end
        return true, ("%d Coins entregues com sucesso"):format(amount)
    end,

    ['gemas'] = function(targetSrc, citizenId, item)
        local amount = tonumber(item.productSlug:match("(%d+)")) or 1
        
        if targetSrc then
            local success = exports.ox_inventory:AddItem(targetSrc, 'gemas', amount)
            if not success then
                MySQL.query.await("UPDATE players SET gemas = gemas + ? WHERE citizenid = ?", { amount, citizenId })
            end
        else
            MySQL.query.await("UPDATE players SET gemas = gemas + ? WHERE citizenid = ?", { amount, citizenId })
        end
        return true, ("%d Gemas entregues com sucesso"):format(amount)
    end,

    ['vips'] = function(targetSrc, citizenId, item)
        -- Exemplo: vip-ouro, vip-diamante, vip-rubi
        local vipTier = item.productSlug:gsub("-vip", "")
        
        -- Atualiza tabela de VIPs do servidor
        MySQL.query.await([[
            INSERT INTO player_vips (citizenid, tier, days, expires_at)
            VALUES (?, ?, 30, DATE_ADD(NOW(), INTERVAL 30 DAY))
            ON DUPLICATE KEY UPDATE 
                tier = VALUES(tier),
                expires_at = DATE_ADD(IF(expires_at > NOW(), expires_at, NOW()), INTERVAL 30 DAY)
        ]], { citizenId, vipTier })

        return true, ("VIP %s ativado por 30 dias"):format(vipTier)
    end,

    ['especiais'] = function(targetSrc, citizenId, item)
        if targetSrc then
            exports.ox_inventory:AddItem(targetSrc, item.productSlug, item.quantity)
        else
            -- Salva na fila de recompensas pendentes
            MySQL.query.await([[
                INSERT INTO player_rewards (citizenid, item, count)
                VALUES (?, ?, ?)
            ]], { citizenId, item.productSlug, item.quantity })
        end
        return true, ("Item especial %s entregue"):format(item.productName)
    end,

    ['policial'] = function(targetSrc, citizenId, item)
        if targetSrc then
            exports.ox_inventory:AddItem(targetSrc, item.productSlug, item.quantity)
        else
            MySQL.query.await([[
                INSERT INTO player_rewards (citizenid, item, count)
                VALUES (?, ?, ?)
            ]], { citizenId, item.productSlug, item.quantity })
        end
        return true, ("Item policial %s entregue"):format(item.productName)
    end,

    ['packs'] = function(targetSrc, citizenId, item)
        if targetSrc then
            exports.ox_inventory:AddItem(targetSrc, item.productSlug, item.quantity)
        else
            MySQL.query.await([[
                INSERT INTO player_rewards (citizenid, item, count)
                VALUES (?, ?, ?)
            ]], { citizenId, item.productSlug, item.quantity })
        end
        return true, ("Pack %s entregue"):format(item.productName)
    end,
}

