<?php
header('Content-Type: application/json');

$to = "mbk.group.78@bk.ru";
$subject = "Новое сообщение из чата на сайте СК Русь";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name    = trim($_POST["name"]);
    $phone   = trim($_POST["phone"]);
    $message = trim($_POST["message"]);
    $source  = isset($_POST["source"]) ? $_POST["source"] : "chat";

    if (empty($name) || empty($phone) || empty($message)) {
        echo json_encode(['success' => false, 'error' => 'empty']);
        exit;
    }

    $body = "
    <html>
    <head><title>Сообщение из чата</title></head>
    <body>
        <h2>Новое сообщение из чата</h2>
        <p><strong>Имя:</strong> {$name}</p>
        <p><strong>Телефон:</strong> {$phone}</p>
        <p><strong>Сообщение:</strong><br>{$message}</p>
        <p><strong>Источник:</strong> {$source}</p>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: Сайт СК Русь <no-reply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
    $headers .= "Reply-To: {$to}\r\n";

    if (mail($to, $subject, $body, $headers)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'mail']);
    }
    exit;
}
?>
