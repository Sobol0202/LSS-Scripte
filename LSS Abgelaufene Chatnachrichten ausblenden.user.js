// ==UserScript==
// @name         LSS Abgelaufene Chatnachrichten ausblenden
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Blendet abgelaufene Einsatz-Chat-Nachrichten im Verbandschat aus.
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    const chatSelector = "#alliance_chat #mission_chat_messages";

    function hideExpiredMessages(root=document) {
        const messages = root.querySelectorAll("li[data-message-time]");
        messages.forEach(msg => {
            const graySpan = msg.querySelector("span[style*='color:#808080'], span[style*='rgb(128, 128, 128)']");
            if (graySpan) {
                msg.style.display = "none";
            }
        });
    }

    function initObserver() {
        const chat = document.querySelector(chatSelector);
        if (!chat) return;

        hideExpiredMessages(chat);

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        hideExpiredMessages(node);
                    }
                });
                hideExpiredMessages(chat);
            });
        });

        observer.observe(chat, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    }

    function waitForChat() {
        const chat = document.querySelector(chatSelector);
        if (chat) {
            initObserver();
        } else {
            setTimeout(waitForChat, 500);
        }
    }

    waitForChat();
})();
