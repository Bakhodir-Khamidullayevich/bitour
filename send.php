<?php
header('Content-Type: application/json; charset=utf-8');

$to = "al.jazeera.f4@gmail.com";
$subject = "Заявка: Подобрать тур (BI tour)";

$name  = isset($_POST['name'])  ? trim($_POST['name'])  : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';

if (mb_strlen($name) < 2 || mb_strlen($phone) < 7) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "invalid"]);
  exit;
}

$message = "Новая заявка с сайта BI tour:\n\n";
$message .= "Имя: {$name}\n";
$message .= "Телефон: {$phone}\n";
$message .= "Дата: " . date("Y-m-d H:i:s") . "\n";
$message .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers = "From: BI tour <no-reply@" . ($_SERVER['HTTP_HOST'] ?? 'site') . ">\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject, $message, $headers);

if (!$sent) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "mail_failed"]);
  exit;
}

echo json_encode(["ok" => true]);
