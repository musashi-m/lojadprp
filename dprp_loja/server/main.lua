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

-- Busca o player online pelo ID numerico ou CitizenID
local function FindPlayer(characterId)
    local num = tonumber(characterId)
    if num and GetPlayerPing(num) > 0 then
        -- Encontrou pelo server source ID direto
        return num, exports.qbx_core:GetPlayer(num)
    end

    -- Busca pelo citizenid nos players conectados
    local players = exports.qbx_core:GetQBPlayers()
    for src, pData in pairs(players) do
        if tostring(pData.PlayerData.citizenid) == tostring(characterId) or tostring(src) == tostring(characterId) then
            return src, pData
        end
    end

    return nil, nil
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

            local resultSummary = table.concat(logs, "\n")
            print(("^2[DPRP Loja] Entrega executada para o pedido %s (ID %s):^0\n%s"):format(orderId, characterId, resultSummary))

            -- Notifica o jogador in-game caso esteja conectado
            if targetSrc then
                NotifyPlayer(targetSrc, "Sua compra na Loja Oficial foi entregue com sucesso! Aproveite seus itens.")
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

