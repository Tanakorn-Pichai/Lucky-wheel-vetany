<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>วงล้อสุ่ม - Lucky Wheel</title>
</head>
<body class="display-page">
    <div class="display-container">
        <div class="display-header">
            <div class="header-nav-row">
                <a href="home.php" class="back-button">← กลับ</a>
            </div>
            <div class="header-top">
                <h1>วงล้อสุ่ม</h1>
            </div>
        </div>

        <div class="wheel-display">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <div class="spinner-btn"></div>
            <div class="wheel" id="wheel"></div>
            <div class="result-display" id="resultDisplay"></div>
        </div>
    </div>

    <script src="shared.js"></script>
    <script src="display.js"></script>
</body>
</html>
