// ==UserScript==
// @name         Leitstellenspiel Lootboxen Simulator
// @namespace    https://www.leitstellenspiel.de/
// @version      1.3.0
// @description  Fügt einen Lootbox-Simulator ein
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @resource     icon data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='18' width='44' height='30' rx='4' fill='%238b5a2b'/%3E%3Crect x='8' y='14' width='48' height='10' rx='4' fill='%23d4af37'/%3E%3Crect x='28' y='14' width='8' height='34' fill='%23f7e27a'/%3E%3C/svg%3E
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'lootbox_stats_v4';

    const BOXES = {
        gold: {
            id: 'gold',
            name: 'Gold',
            label: 'Lootbox Gold',
            cost: 3000,
            coinCost: 220,
            pulls: 3,
            className: 'lsslb-gold'
        },
        silver: {
            id: 'silver',
            name: 'Silber',
            label: 'Lootbox Silber',
            cost: 2100,
            coinCost: 150,
            pulls: 2,
            className: 'lsslb-silver'
        },
        bronze: {
            id: 'bronze',
            name: 'Bronze',
            label: 'Lootbox Bronze',
            cost: 1200,
            coinCost: 100,
            pulls: 1,
            className: 'lsslb-bronze'
        }
    };

    const REWARDS = [
        {
            id: 'vehicle_1',
            name: '1 Fahrzeug',
            eventValue: 70,
            coinValue: 25
        },
        {
            id: 'vehicle_5',
            name: '5 Fahrzeuge',
            eventValue: 350,
            coinValue: 125
        },
        {
            id: 'vehicle_10',
            name: '10 Fahrzeuge',
            eventValue: 700,
            coinValue: 250
        },
        {
            id: 'credits_1000',
            name: '1.000 Credits',
            eventValue: 2,
            coinValue: 0
        },
        {
            id: 'credits_10000',
            name: '10.000 Credits',
            eventValue: 21,
            coinValue: 0
        },
        {
            id: 'credits_100000',
            name: '100.000 Credits',
            eventValue: 210,
            coinValue: 0
        },
        {
            id: 'staff_1',
            name: '1 Mitarbeiter auf einer zufälligen Wache',
            eventValue: 5000,
            coinValue: 5
        }
    ];

    function formatNumber(value) {
        return new Intl.NumberFormat('de-DE').format(value);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function getDefaultRewardStats() {
        const rewardsTemplate = {};
        for (const reward of REWARDS) {
            rewardsTemplate[reward.id] = {
                count: 0,
                eventValue: 0,
                coinValue: 0
            };
        }
        return rewardsTemplate;
    }

    function getDefaultBoxStats() {
        return {
            opened: 0,
            spent: 0,
            spentCoins: 0,
            rewardCount: 0,
            eventValue: 0,
            coinValue: 0,
            rewards: getDefaultRewardStats()
        };
    }

    function getDefaultStats() {
        return {
            totalSpent: 0,
            totalCoinsSpent: 0,
            totalOpened: 0,
            history: [],
            boxes: {
                gold: getDefaultBoxStats(),
                silver: getDefaultBoxStats(),
                bronze: getDefaultBoxStats()
            }
        };
    }

    function loadStats() {
        const data = GM_getValue(STORAGE_KEY, null);
        const merged = getDefaultStats();

        if (!data || typeof data !== 'object') {
            return merged;
        }

        merged.totalSpent = Number(data.totalSpent || 0);
        merged.totalCoinsSpent = Number(data.totalCoinsSpent || 0);
        merged.totalOpened = Number(data.totalOpened || 0);
        merged.history = Array.isArray(data.history) ? data.history.slice(0, 100) : [];

        for (const boxId of Object.keys(merged.boxes)) {
            if (!data.boxes?.[boxId]) continue;

            const srcBox = data.boxes[boxId];
            const dstBox = merged.boxes[boxId];

            dstBox.opened = Number(srcBox.opened || 0);
            dstBox.spent = Number(srcBox.spent || 0);
            dstBox.spentCoins = Number(srcBox.spentCoins || 0);
            dstBox.rewardCount = Number(srcBox.rewardCount || 0);
            dstBox.eventValue = Number(srcBox.eventValue || 0);
            dstBox.coinValue = Number(srcBox.coinValue || 0);

            for (const reward of REWARDS) {
                const srcReward = srcBox.rewards?.[reward.id];
                if (!srcReward) continue;

                dstBox.rewards[reward.id] = {
                    count: Number(srcReward.count || 0),
                    eventValue: Number(srcReward.eventValue || 0),
                    coinValue: Number(srcReward.coinValue || 0)
                };
            }
        }

        return merged;
    }

    function saveStats(stats) {
        GM_setValue(STORAGE_KEY, stats);
    }

    function resetStats() {
        const fresh = getDefaultStats();
        saveStats(fresh);
        return fresh;
    }

    function randomReward() {
        const index = Math.floor(Math.random() * REWARDS.length);
        return REWARDS[index];
    }

    function openBoxes(boxId, amount) {
        const box = BOXES[boxId];
        if (!box) {
            throw new Error(`Ungültige Box-ID: ${boxId}`);
        }

        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        const stats = loadStats();

        const allRewards = [];
        let totalEventValue = 0;
        let totalCoinValue = 0;
        let totalPulls = 0;

        for (let i = 0; i < safeAmount; i++) {
            for (let p = 0; p < box.pulls; p++) {
                const reward = randomReward();
                allRewards.push(reward);
                totalEventValue += reward.eventValue;
                totalCoinValue += reward.coinValue;
                totalPulls++;

                const rewardStats = stats.boxes[boxId].rewards[reward.id];
                rewardStats.count += 1;
                rewardStats.eventValue += reward.eventValue;
                rewardStats.coinValue += reward.coinValue;
            }
        }

        stats.totalSpent += box.cost * safeAmount;
        stats.totalCoinsSpent += box.coinCost * safeAmount;
        stats.totalOpened += safeAmount;

        stats.boxes[boxId].opened += safeAmount;
        stats.boxes[boxId].spent += box.cost * safeAmount;
        stats.boxes[boxId].spentCoins += box.coinCost * safeAmount;
        stats.boxes[boxId].rewardCount += totalPulls;
        stats.boxes[boxId].eventValue += totalEventValue;
        stats.boxes[boxId].coinValue += totalCoinValue;

        stats.history.unshift({
            ts: new Date().toISOString(),
            boxId,
            amount: safeAmount,
            totalPulls,
            totalEventValue,
            totalCoinValue,
            totalSpentThisOpen: box.cost * safeAmount,
            totalCoinsSpentThisOpen: box.coinCost * safeAmount,
            rewards: allRewards.map(reward => reward.id)
        });

        stats.history = stats.history.slice(0, 100);

        saveStats(stats);

        return {
            box,
            amount: safeAmount,
            rewards: allRewards,
            totalEventValue,
            totalCoinValue,
            totalSpentThisOpen: box.cost * safeAmount,
            totalCoinsSpentThisOpen: box.coinCost * safeAmount,
            totalPulls
        };
    }

    function groupRewards(rewards) {
        const map = new Map();

        for (const reward of rewards) {
            if (!map.has(reward.id)) {
                map.set(reward.id, {
                    reward,
                    count: 0
                });
            }
            map.get(reward.id).count += 1;
        }

        return [...map.values()].sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.reward.name.localeCompare(b.reward.name, 'de');
        });
    }

    function getTotals(stats) {
        let totalEventValue = 0;
        let totalCoinValue = 0;
        let totalRewardCount = 0;

        for (const boxId of Object.keys(stats.boxes)) {
            totalEventValue += stats.boxes[boxId].eventValue;
            totalCoinValue += stats.boxes[boxId].coinValue;
            totalRewardCount += stats.boxes[boxId].rewardCount;
        }

        return {
            totalEventValue,
            totalCoinValue,
            totalRewardCount,
            totalEventProfit: totalEventValue - stats.totalSpent,
            totalCoinProfit: totalCoinValue - stats.totalCoinsSpent
        };
    }

    function renderResultHtml(result) {
        const grouped = groupRewards(result.rewards);
        const eventProfit = result.totalEventValue - result.totalSpentThisOpen;
        const coinProfit = result.totalCoinValue - result.totalCoinsSpentThisOpen;

        return `
            <div class="lsslb-result-card">
                <div class="lsslb-result-title">${escapeHtml(result.box.label)} geöffnet</div>
                <div class="lsslb-result-meta">
                    ${formatNumber(result.amount)} Box${result.amount !== 1 ? 'en' : ''},
                    ${formatNumber(result.totalPulls)} Belohnung${result.totalPulls !== 1 ? 'en' : ''}
                </div>
                <div class="lsslb-result-meta">
                    Kosten: ${formatNumber(result.totalSpentThisOpen)} Eventcredits /
                    ${formatNumber(result.totalCoinsSpentThisOpen)} Coins
                </div>
                <div class="lsslb-result-meta">
                    Gegenwert: ${formatNumber(result.totalEventValue)} Eventcredits /
                    ${formatNumber(result.totalCoinValue)} Coins
                </div>
                <div class="lsslb-result-meta">
                    Gewinn/Verlust Eventcredits:
                    <strong class="${eventProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                        ${eventProfit >= 0 ? '+' : ''}${formatNumber(eventProfit)}
                    </strong>
                </div>
                <div class="lsslb-result-meta">
                    Gewinn/Verlust Coins:
                    <strong class="${coinProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                        ${coinProfit >= 0 ? '+' : ''}${formatNumber(coinProfit)}
                    </strong>
                </div>

                <div class="lsslb-result-list">
                    ${grouped.map(entry => `
                        <div class="lsslb-result-item">
                            <span class="lsslb-result-name">${escapeHtml(entry.reward.name)}</span>
                            <span class="lsslb-result-count">× ${formatNumber(entry.count)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderOpenTabContent(contentEl, result = null) {
        const stats = loadStats();
        const totals = getTotals(stats);

        contentEl.innerHTML = `
            <div class="lsslb-summary-grid">
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Ausgegebene Eventcredits</div>
                    <div class="lsslb-summary-value">${formatNumber(stats.totalSpent)}</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Ausgegebene Coins</div>
                    <div class="lsslb-summary-value">${formatNumber(stats.totalCoinsSpent)}</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Geöffnete Boxen</div>
                    <div class="lsslb-summary-value">${formatNumber(stats.totalOpened)}</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Erhaltene Belohnungen</div>
                    <div class="lsslb-summary-value">${formatNumber(totals.totalRewardCount)}</div>
                </div>
            </div>

            <div class="lsslb-box-grid">
                ${Object.values(BOXES).map(box => `
                    <div class="lsslb-box-card ${escapeHtml(box.className)}" data-box-id="${escapeHtml(box.id)}">
                        <div class="lsslb-box-icon">📦</div>
                        <div class="lsslb-box-title">${escapeHtml(box.label)}</div>
                        <div class="lsslb-box-meta">Kosten: ${formatNumber(box.cost)} Eventcredits</div>
                        <div class="lsslb-box-meta">Kosten: ${formatNumber(box.coinCost)} Coins</div>
                        <div class="lsslb-box-meta">Inhalt: ${box.pulls} zufällige Belohnung${box.pulls > 1 ? 'en' : ''}</div>
                        <label class="lsslb-amount-label">
                            Anzahl öffnen:
                            <input class="lsslb-amount-input" type="number" min="1" step="1" value="1" data-box-input="${escapeHtml(box.id)}">
                        </label>
                        <button class="btn btn-sm btn-primary lsslb-open-btn" data-box-open="${escapeHtml(box.id)}">
                            Öffnen
                        </button>
                    </div>
                `).join('')}
            </div>

            <div class="lsslb-result-area">
                ${result ? renderResultHtml(result) : '<div class="lsslb-placeholder">Noch keine Box in diesem Dialog geöffnet.</div>'}
            </div>
        `;

        for (const button of contentEl.querySelectorAll('[data-box-open]')) {
            button.addEventListener('click', () => {
                const boxId = button.getAttribute('data-box-open');
                const input = contentEl.querySelector(`[data-box-input="${boxId}"]`);
                const amount = Math.max(1, Math.floor(Number(input?.value) || 1));
                const openResult = openBoxes(boxId, amount);
                renderOpenTabContent(contentEl, openResult);
            });
        }
    }

    function renderStatsTabContent(contentEl) {
        const stats = loadStats();
        const totals = getTotals(stats);

        contentEl.innerHTML = `
            <div class="lsslb-summary-grid">
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Gesamtausgaben Eventcredits</div>
                    <div class="lsslb-summary-value">${formatNumber(stats.totalSpent)} EC</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Gesamtausgaben Coins</div>
                    <div class="lsslb-summary-value">${formatNumber(stats.totalCoinsSpent)} Coins</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Gesamtgegenwert Eventcredits</div>
                    <div class="lsslb-summary-value">${formatNumber(totals.totalEventValue)} EC</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Gesamtgegenwert Coins</div>
                    <div class="lsslb-summary-value">${formatNumber(totals.totalCoinValue)} Coins</div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Eventcredits Gewinn/Verlust</div>
                    <div class="lsslb-summary-value ${totals.totalEventProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                        ${totals.totalEventProfit >= 0 ? '+' : ''}${formatNumber(totals.totalEventProfit)}
                    </div>
                </div>
                <div class="lsslb-summary-card">
                    <div class="lsslb-summary-title">Coins Gewinn/Verlust</div>
                    <div class="lsslb-summary-value ${totals.totalCoinProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                        ${totals.totalCoinProfit >= 0 ? '+' : ''}${formatNumber(totals.totalCoinProfit)}
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-striped table-condensed lsslb-table">
                    <thead>
                        <tr>
                            <th>Box</th>
                            <th>Geöffnet</th>
                            <th>Ausgaben (EC)</th>
                            <th>Ausgaben (Coins)</th>
                            <th>Belohnungen</th>
                            <th>Gegenwert (EC)</th>
                            <th>Gewinn/Verlust (EC)</th>
                            <th>Gegenwert (Coins)</th>
                            <th>Gewinn/Verlust (Coins)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(BOXES).map(box => {
                            const s = stats.boxes[box.id];
                            const eventProfit = s.eventValue - s.spent;
                            const coinProfit = s.coinValue - s.spentCoins;

                            return `
                                <tr>
                                    <td>${escapeHtml(box.label)}</td>
                                    <td>${formatNumber(s.opened)}</td>
                                    <td>${formatNumber(s.spent)}</td>
                                    <td>${formatNumber(s.spentCoins)}</td>
                                    <td>${formatNumber(s.rewardCount)}</td>
                                    <td>${formatNumber(s.eventValue)}</td>
                                    <td class="${eventProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                        ${eventProfit >= 0 ? '+' : ''}${formatNumber(eventProfit)}
                                    </td>
                                    <td>${formatNumber(s.coinValue)}</td>
                                    <td class="${coinProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                        ${coinProfit >= 0 ? '+' : ''}${formatNumber(coinProfit)}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Gesamt</th>
                            <th>${formatNumber(stats.totalOpened)}</th>
                            <th>${formatNumber(stats.totalSpent)}</th>
                            <th>${formatNumber(stats.totalCoinsSpent)}</th>
                            <th>${formatNumber(totals.totalRewardCount)}</th>
                            <th>${formatNumber(totals.totalEventValue)}</th>
                            <th class="${totals.totalEventProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                ${totals.totalEventProfit >= 0 ? '+' : ''}${formatNumber(totals.totalEventProfit)}
                            </th>
                            <th>${formatNumber(totals.totalCoinValue)}</th>
                            <th class="${totals.totalCoinProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                ${totals.totalCoinProfit >= 0 ? '+' : ''}${formatNumber(totals.totalCoinProfit)}
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="lsslb-reward-breakdown">
                ${Object.values(BOXES).map(box => {
                    const s = stats.boxes[box.id];
                    return `
                        <div class="lsslb-breakdown-card">
                            <div class="lsslb-breakdown-title">${escapeHtml(box.label)}</div>
                            <div class="lsslb-breakdown-list">
                                ${REWARDS.map(reward => `
                                    <div class="lsslb-breakdown-item">
                                        <span>${escapeHtml(reward.name)}</span>
                                        <strong>${formatNumber(s.rewards[reward.id].count)}</strong>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="lsslb-history-card">
                <div class="lsslb-history-title">Letzte Öffnungen</div>
                ${
                    stats.history.length === 0
                        ? '<div class="lsslb-placeholder">Noch keine gespeicherten Öffnungen vorhanden.</div>'
                        : `
                            <div class="lsslb-history-list">
                                ${stats.history.slice(0, 15).map(entry => {
                                    const box = BOXES[entry.boxId];
                                    const eventProfit = entry.totalEventValue - entry.totalSpentThisOpen;
                                    const coinProfit = entry.totalCoinValue - entry.totalCoinsSpentThisOpen;

                                    return `
                                        <div class="lsslb-history-item">
                                            <div>
                                                <strong>${escapeHtml(box?.label || entry.boxId)}</strong> × ${formatNumber(entry.amount)}
                                            </div>
                                            <div>
                                                Kosten: ${formatNumber(entry.totalSpentThisOpen)} EC / ${formatNumber(entry.totalCoinsSpentThisOpen)} Coins
                                            </div>
                                            <div>
                                                Gegenwert: ${formatNumber(entry.totalEventValue)} EC / ${formatNumber(entry.totalCoinValue)} Coins
                                            </div>
                                            <div class="${eventProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                                Gewinn/Verlust Eventcredits: ${eventProfit >= 0 ? '+' : ''}${formatNumber(eventProfit)}
                                            </div>
                                            <div class="${coinProfit >= 0 ? 'lsslb-positive' : 'lsslb-negative'}">
                                                Gewinn/Verlust Coins: ${coinProfit >= 0 ? '+' : ''}${formatNumber(coinProfit)}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `
                }
            </div>

            <div class="lsslb-actions">
                <button class="btn btn-danger btn-sm" id="lsslb-reset-stats">Statistik zurücksetzen</button>
            </div>
        `;

        const resetBtn = contentEl.querySelector('#lsslb-reset-stats');
        resetBtn?.addEventListener('click', () => {
            const confirmed = window.confirm('Möchtest du wirklich alle gespeicherten Lootbox-Statistiken zurücksetzen?');
            if (!confirmed) return;
            resetStats();
            renderStatsTabContent(contentEl);
        });
    }

    function createModal() {
        const existing = document.getElementById('lsslb-modal-overlay');
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = 'lsslb-modal-overlay';
        overlay.innerHTML = `
            <div class="lsslb-modal">
                <div class="lsslb-modal-header">
                    <h3>Lootboxen</h3>
                    <button type="button" class="close" id="lsslb-close-btn" aria-label="Schließen">&times;</button>
                </div>

                <div class="lsslb-tabs">
                    <button class="lsslb-tab active" data-tab="open">Öffnen</button>
                    <button class="lsslb-tab" data-tab="stats">Statistik</button>
                </div>

                <div class="lsslb-modal-body">
                    <div class="lsslb-tab-panel active" data-panel="open"></div>
                    <div class="lsslb-tab-panel" data-panel="stats"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        overlay.querySelector('#lsslb-close-btn')?.addEventListener('click', closeModal);

        const openPanel = overlay.querySelector('[data-panel="open"]');
        const statsPanel = overlay.querySelector('[data-panel="stats"]');

        renderOpenTabContent(openPanel);
        renderStatsTabContent(statsPanel);

        for (const tabBtn of overlay.querySelectorAll('.lsslb-tab')) {
            tabBtn.addEventListener('click', () => {
                for (const btn of overlay.querySelectorAll('.lsslb-tab')) {
                    btn.classList.remove('active');
                }

                for (const panel of overlay.querySelectorAll('.lsslb-tab-panel')) {
                    panel.classList.remove('active');
                }

                tabBtn.classList.add('active');
                const tab = tabBtn.getAttribute('data-tab');
                overlay.querySelector(`[data-panel="${tab}"]`)?.classList.add('active');

                if (tab === 'stats') {
                    renderStatsTabContent(statsPanel);
                } else {
                    renderOpenTabContent(openPanel);
                }
            });
        }
    }

    function insertTrigger() {
        if (document.getElementById('lsslb-trigger-item')) {
            return;
        }

        const triggerLi = document.createElement('li');
        const triggerA = document.createElement('a');
        const triggerImg = document.createElement('img');

        triggerLi.id = 'lsslb-trigger-item';
        triggerImg.src = GM_getResourceURL('icon');
        triggerImg.width = 24;
        triggerImg.height = 24;
        triggerA.href = '#';
        triggerA.append(triggerImg, '\xa0Lootboxen');
        triggerLi.append(triggerA);

        triggerLi.addEventListener('click', event => {
            event.preventDefault();
            createModal();
        });

        document
            .querySelector('#menu_profile + .dropdown-menu > li.divider')
            ?.before(triggerLi);
    }

    function addStyles() {
        GM_addStyle(`
            #lsslb-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.55);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .lsslb-modal {
                width: min(1100px, 100%);
                max-height: 90vh;
                overflow: hidden;
                background: #fff;
                border-radius: 10px;
                box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35);
                display: flex;
                flex-direction: column;
            }

            .lsslb-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 18px;
                border-bottom: 1px solid #ddd;
            }

            .lsslb-modal-header h3 {
                margin: 0;
                font-size: 22px;
            }

            .lsslb-tabs {
                display: flex;
                gap: 8px;
                padding: 12px 18px 0;
                border-bottom: 1px solid #eee;
            }

            .lsslb-tab {
                border: 1px solid #ccc;
                border-bottom: none;
                background: #f7f7f7;
                padding: 10px 14px;
                cursor: pointer;
                border-radius: 8px 8px 0 0;
                font-weight: 600;
            }

            .lsslb-tab.active {
                background: #fff;
            }

            .lsslb-modal-body {
                padding: 18px;
                overflow: auto;
            }

            .lsslb-tab-panel {
                display: none;
            }

            .lsslb-tab-panel.active {
                display: block;
            }

            .lsslb-summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;
                margin-bottom: 18px;
            }

            .lsslb-summary-card {
                background: #f8f9fa;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                padding: 12px;
            }

            .lsslb-summary-title {
                font-size: 12px;
                text-transform: uppercase;
                color: #666;
                margin-bottom: 6px;
            }

            .lsslb-summary-value {
                font-size: 22px;
                font-weight: 700;
            }

            .lsslb-box-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 16px;
                margin-bottom: 18px;
            }

            .lsslb-box-card {
                border-radius: 12px;
                padding: 16px;
                border: 1px solid #d8d8d8;
                box-shadow: 0 4px 12px rgba(0,0,0,.08);
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .lsslb-box-icon {
                font-size: 34px;
                line-height: 1;
            }

            .lsslb-box-title {
                font-size: 18px;
                font-weight: 700;
            }

            .lsslb-box-meta {
                color: #444;
                font-size: 13px;
            }

            .lsslb-gold {
                background: linear-gradient(180deg, #fff6cf 0%, #f4e19f 100%);
            }

            .lsslb-silver {
                background: linear-gradient(180deg, #f7f7f7 0%, #dfe3e8 100%);
            }

            .lsslb-bronze {
                background: linear-gradient(180deg, #f5dfcf 0%, #d5a37f 100%);
            }

            .lsslb-amount-label {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 13px;
                margin-top: auto;
            }

            .lsslb-amount-input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #bbb;
                border-radius: 6px;
            }

            .lsslb-open-btn {
                margin-top: 4px;
            }

            .lsslb-result-area {
                margin-top: 10px;
            }

            .lsslb-placeholder {
                border: 2px dashed #ccc;
                border-radius: 10px;
                padding: 18px;
                color: #666;
                text-align: center;
                background: #fafafa;
            }

            .lsslb-result-card {
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 14px;
                background: #fafafa;
            }

            .lsslb-result-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 6px;
            }

            .lsslb-result-meta {
                margin-bottom: 4px;
                color: #444;
            }

            .lsslb-result-list {
                margin-top: 12px;
                display: grid;
                gap: 8px;
            }

            .lsslb-result-item {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                padding: 8px 10px;
                background: #fff;
                border: 1px solid #e6e6e6;
                border-radius: 8px;
            }

            .lsslb-result-name {
                font-weight: 600;
            }

            .lsslb-result-count {
                font-weight: 700;
            }

            .lsslb-table th,
            .lsslb-table td {
                vertical-align: middle !important;
            }

            .lsslb-reward-breakdown {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 16px;
                margin-top: 18px;
            }

            .lsslb-breakdown-card {
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 12px;
                background: #fff;
            }

            .lsslb-breakdown-title {
                font-weight: 700;
                font-size: 16px;
                margin-bottom: 10px;
            }

            .lsslb-breakdown-list {
                display: grid;
                gap: 6px;
            }

            .lsslb-breakdown-item {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .lsslb-breakdown-item:last-child {
                border-bottom: none;
            }

            .lsslb-history-card {
                margin-top: 18px;
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 14px;
                background: #fff;
            }

            .lsslb-history-title {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 10px;
            }

            .lsslb-history-list {
                display: grid;
                gap: 10px;
            }

            .lsslb-history-item {
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 10px;
                background: #fafafa;
            }

            .lsslb-actions {
                margin-top: 18px;
                display: flex;
                justify-content: flex-end;
            }

            .lsslb-positive {
                color: #1f8b24;
                font-weight: 700;
            }

            .lsslb-negative {
                color: #c9302c;
                font-weight: 700;
            }

            #lsslb-trigger-item img {
                object-fit: contain;
                vertical-align: middle;
            }

            @media (max-width: 768px) {
                .lsslb-modal {
                    width: 100%;
                    max-height: 95vh;
                }

                .lsslb-summary-grid,
                .lsslb-box-grid,
                .lsslb-reward-breakdown {
                    grid-template-columns: 1fr;
                }
            }
        `);
    }

    function init() {
        addStyles();

        const observer = new MutationObserver(() => {
            insertTrigger();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        insertTrigger();
    }

    init();
})();
