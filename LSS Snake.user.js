// ==UserScript==
// @name         Snake Game in Leitstellenspiel
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Snake Game in Leitstellenspiel einfügen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Funktion zum Starten des Snake-Spiels
    function startSnakeGame() {
        var canvas = document.getElementById('game');
        var context = canvas.getContext('2d');

        var gridSize = 20;
        var count = 0;
        var score = 0;
        var speed = 100; // Standardgeschwindigkeit (in Millisekunden)

        var snake = {
            x: gridSize * 4,
            y: gridSize * 4,
            dx: gridSize,
            dy: 0,
            cells: [],
            maxCells: 4
        };

        function loadImage(url) {
            var img = new Image();
            img.src = url;
            return img;
        }

        function getRandomPosition() {
            return Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        function getRandomImage(array) {
            return loadImage(array[getRandomInt(0, array.length)]);
        }

        var appleImages = [
            'https://www.leitstellenspiel.de/images/fire_rot.png',
            'https://www.leitstellenspiel.de/images/sawmill_rot.png',
            'https://www.leitstellenspiel.de/images/oil_rot.png',
            'https://www.leitstellenspiel.de/images/medicalstore_rot.png',
            'https://www.leitstellenspiel.de/images/caraccident_rot.png'
        ];

        var getRandomAppleImage = function () {
            return getRandomImage(appleImages);
        };

        var emergencySymbols = [
            'https://www.leitstellenspiel.de/images/vehicles/red_truck.png',
            'https://www.leitstellenspiel.de/images/vehicles/green_car.png',
            'https://www.leitstellenspiel.de/images/vehicles/red_boat_trailer.png',
            'https://www.leitstellenspiel.de/images/vehicles/red_arff.png',
            'https://www.leitstellenspiel.de/images/vehicles/red_rescue_stairs.png'
        ];

        var getRandomEmergencyImage = function () {
            return getRandomImage(emergencySymbols);
        };

        var apple = {
            x: getRandomPosition(),
            y: getRandomPosition(),
            symbol: getRandomAppleImage()
        };

        function loop() {
            requestAnimationFrame(loop);

            if (++count < speed / 10) {
                return;
            }

            count = 0;
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);

            snake.x += snake.dx;
            snake.y += snake.dy;

            if (snake.x < 0) {
                snake.x = canvas.width - gridSize;
            } else if (snake.x >= canvas.width) {
                snake.x = 0;
            }

            if (snake.y < 0) {
                snake.y = canvas.height - gridSize;
            } else if (snake.y >= canvas.height) {
                snake.y = 0;
            }

            snake.cells.unshift({ x: snake.x, y: snake.y });

            if (snake.cells.length > snake.maxCells) {
                snake.cells.pop();
            }

            context.drawImage(apple.symbol, apple.x, apple.y, gridSize, gridSize);

            snake.cells.forEach(function (cell, index) {
                var symbol = getRandomEmergencyImage();
                context.drawImage(symbol, cell.x, cell.y, gridSize, gridSize);

                if (cell.x === apple.x && cell.y === apple.y) {
                    snake.maxCells++;

                    apple.x = getRandomPosition();
                    apple.y = getRandomPosition();
                    apple.symbol = getRandomAppleImage();

                    score += 1;
                }

                for (var i = index + 1; i < snake.cells.length; i++) {
                    if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                        snake.x = gridSize * 4;
                        snake.y = gridSize * 4;
                        snake.cells = [];
                        snake.maxCells = 4;
                        snake.dx = gridSize;
                        snake.dy = 0;

                        apple.x = getRandomPosition();
                        apple.y = getRandomPosition();
                        apple.symbol = getRandomAppleImage();

                        score = 0;
                    }
                }
            });

            context.fillStyle = 'white';
            context.font = '20px Arial';
            context.fillText('Score: ' + score, 10, 20);
        }

        document.addEventListener('keydown', function (e) {
            if (e.which === 37 && snake.dx === 0) {
                snake.dx = -gridSize;
                snake.dy = 0;
            } else if (e.which === 38 && snake.dy === 0) {
                snake.dy = -gridSize;
                snake.dx = 0;
            } else if (e.which === 39 && snake.dx === 0) {
                snake.dx = gridSize;
                snake.dy = 0;
            } else if (e.which === 40 && snake.dy === 0) {
                snake.dy = gridSize;
                snake.dx = 0;
            }
        });

        // Erstelle den Schieberegler für die Geschwindigkeit
        var speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = '50'; // Minimale Geschwindigkeit
        speedSlider.max = '200'; // Maximale Geschwindigkeit
        speedSlider.step = '10'; // Schritte
        speedSlider.value = speed.toString();
        speedSlider.addEventListener('input', function () {
            speed = parseInt(speedSlider.value);
        });

        // Füge den Schieberegler zur Lightbox hinzu
        var speedLabel = document.createElement('label');
        speedLabel.textContent = 'Speed:';
        speedLabel.appendChild(speedSlider);

        // Setze die Position des Schiebereglers unterhalb des Spielfelds
        speedLabel.style.position = 'absolute';
        speedLabel.style.bottom = '20px';
        speedLabel.style.left = '50%';
        speedLabel.style.transform = 'translateX(-50%)';

        document.getElementById('snake-lightbox-content').appendChild(speedLabel);

        canvas.width = 400;
        canvas.height = 400;
        loop();
    }

    function closeLightbox() {
        var lightbox = document.getElementById('snake-lightbox');
        lightbox.parentNode.removeChild(lightbox);
        document.body.style.overflow = 'auto';
    }

    // Erstelle den Button zum Aufrufen des Spiels
    var openLightboxButton = document.createElement('button');
    openLightboxButton.textContent = 'S';
    openLightboxButton.style.position = 'relative'; // Verwende relative Positionierung
    openLightboxButton.className = 'btn btn-success btn-xs';

    openLightboxButton.addEventListener('click', function () {
        var lightbox = document.createElement('div');
        lightbox.id = 'snake-lightbox';
        lightbox.style.position = 'fixed';
        lightbox.style.top = '0';
        lightbox.style.left = '0';
        lightbox.style.width = '100%';
        lightbox.style.height = '100%';
        lightbox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        lightbox.style.zIndex = '10000';

        var lightboxContent = document.createElement('div');
        lightboxContent.id = 'snake-lightbox-content';
        lightboxContent.style.position = 'absolute';
        lightboxContent.style.top = '50%';
        lightboxContent.style.left = '50%';
        lightboxContent.style.transform = 'translate(-50%, -50%)';
        lightboxContent.style.padding = '20px';
        lightboxContent.style.borderRadius = '10px';
        lightboxContent.style.backgroundColor = '#fff';

        var gameCanvas = document.createElement('canvas');
        gameCanvas.width = 400;
        gameCanvas.height = 400;
        gameCanvas.id = 'game';

        lightboxContent.appendChild(gameCanvas);

        var closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '20px';
        closeButton.style.padding = '5px 10px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.background = '#ccc';
        closeButton.style.color = '#333';
        closeButton.addEventListener('click', closeLightbox);

        lightboxContent.appendChild(closeButton);
        lightbox.appendChild(lightboxContent);

        document.body.appendChild(lightbox);

        document.body.style.overflow = 'hidden';

        startSnakeGame();
    });

    // Füge den Button neben die Social Media Buttons im Footer hinzu
    var socialMediaLinks = document.querySelector('.social-media-links');
    socialMediaLinks.appendChild(openLightboxButton);
})();
