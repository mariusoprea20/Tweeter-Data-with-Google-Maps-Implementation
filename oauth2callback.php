<?php
//author: Marius Oprea
//date:08/05/2023

//load the autoloader from the vendor directory to get all the OAuth dependencies that the script will need
require_once __DIR__.'/vendor/autoload.php';
//start or resume a session
session_start();
//create a new instance of the Google Client 
$client = new Google\Client();

//set the authentication confogiration using client secret credentials
$client->setAuthConfig('client_secret.json');
//set the redirect url to which response from Googl OAuth server 
//will be sent after the user credentials are authenticated.
//bind the http host with the file path outh2callback.php
$client->setRedirectUri('http://'.$_SERVER['HTTP_HOST'].'/oauth2callback.php');
//add a scope for authorising the app with (we don't actually use this information but the app)
//won't authorise without a scope set
$client->addScope("https://www.googleapis.com/auth/userinfo.email");

//check if there is an authorisation code in the get request
if(! isset($_GET['code'])){
    //if there is not, send the user to the authentication page
    $auth_url= $client->createAuthUrl();
    header('Location: '.filter_var($auth_url, FILTER_SANITIZE_URL));
} else {
    //if the code exists in the GET method
    $client->authenticate($_GET['code']);
    //set the session access token to the client auth access token
    $_SESSION['access_token'] = $client->getAccessToken();
    //create a variable that stores the index.php url
    $redirect_uri = 'http://'.$_SERVER['HTTP_HOST'].'/index.php';
    //redirect the user to the index.php using header()
    header('Location: '.filter_var($redirect_uri, FILTER_SANITIZE_URL));
}
?>