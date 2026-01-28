<?php
header('Content-Type: application/json');

// Import PHPMailer classes into the global namespace
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader (or manual path to src files)
require 'vendor/autoload.php';

// 1. Database Configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "portfolio";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// 2. Collect Data
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$message = $_POST['message'] ?? '';

// 3. Save to Database First
$stmt = $conn->prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $email, $message);

if ($stmt->execute()) {
    
    // 4. Send Email using PHPMailer
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'sumit.kotiya789@gmail.com';           
        $mail->Password   = 'ssfs vfdl bsst lisy';             
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('sumit.kotiya789@gmail.com', 'Sumit Kotiya');
        $mail->addAddress($email, $name);     
        $mail->addReplyTo('sumit.kotiya789@gmail.com', 'Information');

        // Content
        $mail->isHTML(true);                                
        $mail->Subject = 'Thank you for contacting me!';
        $mail->Body = "
        <div style='background-color: #0a0a0a; padding: 40px 20px; font-family: sans-serif; line-height: 1.6;'>
            <table max-width='600px' style='margin: 0 auto; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; border-spacing: 0;'>
                <tr>
                    <td style='background-color: #0a0a0a; padding: 30px; text-align: center; border-bottom: 2px solid #D4AF37;'>
                        <h1 style='margin: 0; color: #D4AF37; font-size: 24px; letter-spacing: 2px;'>SUMIT KOTIYA</h1>
                        <p style='margin: 5px 0 0; color: #888; font-size: 12px; text-transform: uppercase;'>Android & Blockchain Developer</p>
                    </td>
                </tr>
                
                <tr>
                    <td style='padding: 40px 30px;'>
                        <h2 style='color: #ffffff; font-size: 20px; margin-top: 0;'>Hello <span style='color: #D4AF37;'>$name</span>,</h2>
                        <p style='color: #cccccc; font-size: 15px;'>
                            Thank you for reaching out! I've successfully received your message through my portfolio contact form. It's great to connect with you.
                        </p>
                        
                        <div style='background-color: #0a0a0a; border-left: 4px solid #D4AF37; padding: 20px; margin: 25px 0;'>
                            <p style='color: #D4AF37; margin: 0 0 10px; font-size: 12px; font-weight: bold; text-transform: uppercase;'>Your Message:</p>
                            <p style='color: #eeeeee; margin: 0; font-style: italic; font-size: 14px;'>\"$message\"</p>
                        </div>
                        
                        <p style='color: #cccccc; font-size: 15px;'>
                            I usually respond within 24 hours. In the meantime, feel free to explore my latest projects on GitHub or connect with me on LinkedIn.
                        </p>
                        
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='https://github.com/sumit-kotiya789' style='background-color: #D4AF37; color: #0a0a0a; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>View My Github</a>
                        </div>
                    </td>
                </tr>
                
                <tr>
                    <td style='padding: 30px; background-color: #0d0d0d; text-align: center; border-top: 1px solid #2a2a2a;'>
                        <p style='margin: 0; color: #666; font-size: 12px;'>
                            &copy; 2026 Sumit Kotiya. All rights reserved.
                        </p>
                        <div style='margin-top: 15px;'>
                            <a href='https://www.linkedin.com/in/sumit-kotiya-a511b0331/' style='color: #D4AF37; text-decoration: none; margin: 0 10px; font-size: 12px;'>LinkedIn</a>
                            <a href='https://www.instagram.com/the_brahmin_boi' style='color: #D4AF37; text-decoration: none; margin: 0 10px; font-size: 12px;'>Instagram</a>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        ";

        $mail->send();
        echo json_encode(["status" => "success", "message" => "Message saved and email sent!"]);

    } catch (Exception $e) {
        // Even if mail fails, the DB record was saved
        echo json_encode(["status" => "partial_success", "message" => "Message saved, but email failed: {$mail->ErrorInfo}"]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Failed to save to database."]);
}

$stmt->close();
$conn->close();
?>