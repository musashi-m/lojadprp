-- ==============================================================
-- Distrito Paulista RP - Script de Entrega Automatica da Loja
-- ==============================================================

local function SendDiscordLog(title, description, color)
    if not Config.DiscordWebhook or Config.DiscordWebhook == "" then return end

    local embed = {
        {
            ["title"] = title,
            ["description"] = description,
            ["color"] = color or 15703808, -- Amarelo Distrito
            ["footer"] = {
                ["text"] = "Distrito Paulista RP • Entrega Automatica",
            },
            ["timestamp"] = os.date("!%Y-%m-%dT%H:%M:%SZ")
        }
    }

    PerformHttpRequest(Config.DiscordWebhook, function(err, text, headers) end, 'POST', json.encode({
        username = "Loja DPRP",
        embeds = embed
    }), { ['Content-Type'] = 'application/json' })
end

local function NotifyPlayer(targetSrc, message)
    if not targetSrc then return end
    
    if Config.NotifySystem == 'ox_lib' then
        TriggerClientEvent('ox_lib:notify', targetSrc, {
            title = 'Loja Oficial DPRP',
            description = message,
            type = 'success',
            duration = 8000
        })
    else
        TriggerClientEvent('chat:addMessage', targetSrc, {
            color = { 239, 159, 0 },
            multiline = true,
            args = { "Loja Oficial", message }
        })
    end
end

-- Obtém o nome RP mais preciso do comprador (Qbox / QBCore / Banco MySQL / Loja / Steam)
local function GetPlayerCharacterName(characterId, targetSrc, playerData, fallbackName)
    -- 1. Se o jogador estiver online com dados no Qbox / QBCore
    if playerData and playerData.PlayerData and playerData.PlayerData.charinfo then
        local char = playerData.PlayerData.charinfo
        if char.firstname and char.lastname and char.firstname ~= "" then
            return ("%s %s"):format(char.firstname, char.lastname)
        end
    end

    -- 2. Tenta buscar direto no export qbx_core se o targetSrc estiver online
    if targetSrc and exports.qbx_core and exports.qbx_core.GetPlayer then
        local ok, p = pcall(function() return exports.qbx_core:GetPlayer(targetSrc) end)
        if ok and p and p.PlayerData and p.PlayerData.charinfo then
            local char = p.PlayerData.charinfo
            if char.firstname and char.lastname and char.firstname ~= "" then
                return ("%s %s"):format(char.firstname, char.lastname)
            end
        end
    end

    -- 3. Se estiver offline, consulta o banco MySQL (players table do Qbox)
    local charDbName = nil
    pcall(function()
        if MySQL and MySQL.query and MySQL.query.await then
            local res = MySQL.query.await("SELECT charinfo FROM players WHERE citizenid = ? OR id = ? LIMIT 1", { tostring(characterId), tostring(characterId) })
            if res and res[1] and res[1].charinfo then
                local char = json.decode(res[1].charinfo)
                if char and char.firstname and char.lastname then
                    charDbName = ("%s %s"):format(char.firstname, char.lastname)
                end
            end
        end
    end)
    if charDbName and charDbName ~= "" then
        return charDbName
    end

    -- 4. Nome informado na loja / Discord
    if fallbackName and fallbackName ~= "" and fallbackName ~= "Nao informado" then
        return fallbackName
    end

    -- 5. Nome do Steam / FiveM se online
    if targetSrc and GetPlayerPing(targetSrc) > 0 then
        local sName = GetPlayerName(targetSrc)
        if sName and sName ~= "" then return sName end
    end

    -- 6. Passaporte como fallback seguro
    return ("Passaporte #%s"):format(tostring(characterId))
end

-- Notificação Global para toda a cidade (canto superior esquerdo)
local function BroadcastPurchase(buyerName, productsText)
    if not Config.BroadcastPurchase then return end

    local broadcastMsg = (Config.BroadcastMessage or "{player} adquiriu {product} na nossa loja!")
        :gsub("{player}", buyerName)
        :gsub("{product}", productsText)

    local bType = Config.BroadcastType or 'both'

    -- 1. Notificação no Chat (canto superior esquerdo) com Card HTML estilizado
    if bType == 'chat' or bType == 'both' then
        TriggerClientEvent('chat:addMessage', -1, {
            template = '<div style="padding: 0.6vw 0.9vw; margin: 0.35vw 0; background: linear-gradient(135deg, rgba(11, 15, 29, 0.96) 0%, rgba(17, 24, 39, 0.92) 100%); border-left: 4px solid #00D26A; border-radius: 8px; box-shadow: 0 4px 18px rgba(0, 210, 106, 0.28); font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; display: flex; align-items: center; gap: 10px;"><div style="background: #00D26A; color: #000; font-weight: 900; font-size: 11px; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">LOJA</div><div style="color: #F3F4F6; font-size: 13px; font-weight: 500;"><span style="color: #00D26A; font-weight: 700;">{0}</span> adquiriu <span style="color: #FCD34D; font-weight: 700;">{1}</span> na nossa loja! 🛍️</div></div>',
            args = { buyerName, productsText }
        })
    end

    -- 2. Notificação via ox_lib no canto superior esquerdo (se configurado)
    if bType == 'ox_lib' or bType == 'both' then
        pcall(function()
            TriggerClientEvent('ox_lib:notify', -1, {
                id = 'dprp_store_broadcast_' .. math.random(1000, 9999),
                title = 'Distrito Paulista RP • Loja',
                description = broadcastMsg,
                position = 'top-left',
                type = 'success',
                duration = Config.BroadcastDuration or 9000,
                icon = 'cart-shopping',
                iconColor = '#00D26A'
            })
        end)
    end
end

-- Busca o player online pelo ID numerico ou CitizenID
local function FindPlayer(characterId)
    local charIdStr = tostring(characterId)
    local num = tonumber(characterId)

    -- 1. Se fornecido server ID numérico direto
    if num and GetPlayerPing(num) > 0 then
        local pData = nil
        pcall(function()
            if exports.qbx_core and exports.qbx_core.GetPlayer then
                pData = exports.qbx_core:GetPlayer(num)
            end
        end)
        return num, pData
    end

    -- 2. Busca pelo citizenid no qbx_core
    local foundSrc, foundData = nil, nil
    pcall(function()
        if exports.qbx_core then
            if exports.qbx_core.GetPlayerByCitizenId then
                local p = exports.qbx_core:GetPlayerByCitizenId(charIdStr)
                if p and p.PlayerData and p.PlayerData.source then
                    foundSrc = p.PlayerData.source
                    foundData = p
                    return
                end
            end
            if exports.qbx_core.GetQBPlayers then
                local players = exports.qbx_core:GetQBPlayers()
                for src, pData in pairs(players) do
                    if pData and pData.PlayerData then
                        if tostring(pData.PlayerData.citizenid) == charIdStr or tostring(src) == charIdStr then
                            foundSrc = src
                            foundData = pData
                            return
                        end
                    end
                end
            end
        end
    end)

    return foundSrc, foundData
end

local function AcknowledgeDelivery(orderId, resultMsg)
    local url = ("%s/api/deliveries/%s/complete"):format(Config.ApiUrl, orderId)
    
    PerformHttpRequest(url, function(statusCode, responseText, headers)
        if statusCode == 200 then
            print(("^2[DPRP Loja] Pedido %s confirmado como entregue com sucesso no backend.^0"):format(orderId))
        else
            print(("^1[DPRP Loja] Falha ao confirmar entrega do pedido %s. Status: %s^0"):format(orderId, tostring(statusCode)))
        end
    end, 'POST', json.encode({
        response = resultMsg,
        timestamp = os.date("%Y-%m-%d %H:%M:%S")
    }), {
        ['Content-Type'] = 'application/json',
        ['Authorization'] = 'Bearer ' .. Config.ApiSecret
    })
end

local function ProcessDeliveries()
    local url = Config.ApiUrl .. "/api/deliveries/pending"
    
    PerformHttpRequest(url, function(statusCode, responseText, headers)
        if statusCode ~= 200 then
            if statusCode ~= 0 then
                print(("^3[DPRP Loja] Checagem de entregas: status %s (verifique Config.ApiUrl e Config.ApiSecret)^0"):format(tostring(statusCode)))
            end
            return
        end

        local data = json.decode(responseText)
        if not data or not data.success or not data.deliveries then return end

        for _, delivery in ipairs(data.deliveries) do
            local orderId = delivery.orderId
            local characterId = delivery.characterId
            local discordId = delivery.discordId or "Nao informado"
            local targetSrc, playerData = FindPlayer(characterId)
            
            local logs = {}
            local overallSuccess = true

            for _, item in ipairs(delivery.items) do
                local qty = tonumber(item.quantity) or 1
                if item.commands and #item.commands > 0 then
                    for q = 1, qty do
                        for _, cmdObj in ipairs(item.commands) do
                            local cmdStr = type(cmdObj) == "table" and cmdObj.command or tostring(cmdObj)
                            local timing = type(cmdObj) == "table" and cmdObj.timing or "Após a confirmação"
                            if timing == "Após a confirmação" then
                                -- Executa comando de servidor no Qbox / FiveM
                                ExecuteCommand(cmdStr)
                                table.insert(logs, ("• Executado comando: %s"):format(cmdStr))
                            end
                        end
                    end
                else
                    local handler = Config.Categories[item.category]
                    if handler then
                        local success, msg = handler(targetSrc, characterId, item)
                        if success then
                            table.insert(logs, ("• %s (x%d): %s"):format(item.productName, item.quantity, msg or "OK"))
                        else
                            overallSuccess = false
                            table.insert(logs, ("• [ERRO] %s: %s"):format(item.productName, msg or "Falha"))
                        end
                    else
                        table.insert(logs, ("• Categoria sem handler: %s"):format(item.category))
                    end
                end
            end

            local resultSummary = table.concat(logs, "\n")
            print(("^2[DPRP Loja] Entrega executada para o pedido %s (ID %s):^0\n%s"):format(orderId, characterId, resultSummary))

            local isExpiration = tostring(orderId):find("^EXP%-") ~= nil

            -- Notifica o jogador in-game caso esteja conectado
            if targetSrc then
                if isExpiration then
                    NotifyPlayer(targetSrc, "Um de seus pacotes temporários ou VIPs da Loja Oficial expirou.")
                else
                    NotifyPlayer(targetSrc, "Sua compra na Loja Oficial foi entregue com sucesso! Aproveite seus itens.")
                end
            end

            -- Notificação Global para toda a cidade (canto superior esquerdo)
            if not isExpiration and overallSuccess then
                local buyerName = GetPlayerCharacterName(characterId, targetSrc, playerData, delivery.customerName or delivery.discordUsername)
                local productNames = {}
                for _, it in ipairs(delivery.items) do
                    local q = tonumber(it.quantity) or 1
                    if q > 1 then
                        table.insert(productNames, ("%dx %s"):format(q, it.productName))
                    else
                        table.insert(productNames, it.productName)
                    end
                end
                local productsText = table.concat(productNames, ", ")
                if productsText == "" then productsText = "um item exclusivo" end

                BroadcastPurchase(buyerName, productsText)
            end

            -- Confirma a entrega na API da Loja Web
            AcknowledgeDelivery(orderId, resultSummary)

            -- Envia log para o canal da Staff no Discord
            SendDiscordLog(
                ("Entrega Realizada - Pedido #%s"):format(orderId),
                ("**ID do Personagem:** %s\n**Discord ID:** %s\n**Valor:** R$ %.2f\n**Itens:**\n%s"):format(
                    characterId,
                    discordId,
                    delivery.totalAmount or 0,
                    resultSummary
                ),
                3066993 -- Verde
            )
        end
    end, 'GET', '', {
        ['Authorization'] = 'Bearer ' .. Config.ApiSecret
    })
end

-- Thread principal de polling automatico
CreateThread(function()
    print("^3======================================================^0")
    print("^2[DPRP Loja] Iniciando comunicacao com a Loja Oficial...^0")
    print(("^2[DPRP Loja] Servidor da Loja: %s^0"):format(Config.ApiUrl))
    print(("^2[DPRP Loja] Frequencia de Checagem: %d segundos^0"):format(Config.PollInterval))
    print("^3======================================================^0")

    while true do
        Wait(Config.PollInterval * 1000)
        pcall(ProcessDeliveries)
    end
end)

