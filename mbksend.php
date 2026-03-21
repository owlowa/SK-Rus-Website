<?php
header('Content-Type: application/json'); // указываем, что возвращаем JSON

$to = "mbk.group.78@bk.ru";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name   = trim($_POST["name"]);
    $phone  = trim($_POST["phone"]);
    $consent = isset($_POST["consent"]) ? "Да" : "Нет";

    if (empty($name) || empty($phone)) {
        echo json_encode(['success' => false, 'error' => 'empty']);
        exit;
    }

    $subject = "Новая заявка с сайта СК Русь";
    $message = "
    <html>
    <head><title>Заявка с сайта</title></head>
    <body>
        <h2>Новая заявка</h2>
        <p><strong>Имя:</strong> {$name}</p>
        <p><strong>Телефон:</strong> {$phone}</p>
        <p><strong>Согласие:</strong> {$consent}</p>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: СК Русь <no-reply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
    $headers .= "Reply-To: {$to}\r\n";

    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'mail']);
    }
    exit;
}
?>