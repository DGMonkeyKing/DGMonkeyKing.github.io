<?php
$name = $_POST['name'];
$email = $_POST['email'];
$message = $_POST['message'];
$to = 'davidnew33@gmail.com'; 
$subject = $_POST['subject'];
		
$body = "From: $name\n E-Mail: $email\n Message:\n $message";
$header = "From: $name";
	
if($_POST){
	if($name == '' || $email == '' || $message == ''){
		$feedback = 'Fill out the fields';
	}else{
		mail($to, $subject, $body, $header);
		$feedback = 'Thanks!';
	}
}
?>