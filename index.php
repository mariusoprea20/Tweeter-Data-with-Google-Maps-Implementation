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
//add a scope for authorising the app with (we don't actually use this information but the app)
//won't authorise without a scope set
$client->addScope("https://www.googleapis.com/auth/userinfo.email");

//check if there is an existing token in the current session
if(isset($_SESSION['access_token'])&&$_SESSION['access_token']){
    //set the client access token  to the on in the current session
    $client->setAccessToken($_SESSION['access_token']);
    //display the google OAuth instructions in a HTML structure
    echo"<h1>About Page</h1>";
    echo"<p>To improve the security and user experience of my web solution hosted on Azure, 
    I implemented Google OAuth2, an authorization framework that  allows restricted access to user accounts on web services. 
    This framework streamlines authentication by leveraging Google's authentication system and then granting access to my 
    application.<p>";

    echo"<p>I started by setting up a new OAuth project in my Google Developer account. The setup required me to configure 
    an OAuth consent screen, which is a crucial step to authorize OAuth consent on my website. This configuration involved 
    providing the name of my application, the URL for my Azure Virtual Machine homepage, and my contact information(email address).</p>";

    echo"<p>Next, I created the OAuth server credentials by inputting my website URI, which had to be a top-level domain(.com, .co.uk or .org). 
     This is the step where I bound my Azure VM to the Google OAuth application by supplying the VM DNS name label. 
     I also specified an authorized redirect URI, in my case, 'oauth2callback.php'. This URI is used to redirect users to the login page 
     if they are not authenticated.</p>";

    echo"<p>Once the OAuth application was set up, Google supplied a client ID and a secret JSON file holding the OAuth project details. 
    These credentials are key to allowing users to sign in through Google OAuth to access certain sections of my website.</p>";
    
    echo"<p>Subsequently, I installed Google OAuth on my Azure Virtual Machine. This process involved using Composer, 
     a PHP dependency management tool, to download all the required files. The command provided in the workshop pulled down the Google OAuth client
     dependency files and stored them within a 'Vendor' folder in my VM. An important file, 'autoload.php', 
     was included in the folder mentioned above. This file automatically runs the Google OAuth dependencies.</p>";

    echo"<p>I then created two PHP files to make use of the OAuth service. The 'index.php' file checks for the authentication status.
     If the user is authenticated, access to the web application is granted. If not, the user is redirected to an authentication
     page. The second file, 'oauth2callback.php', contains the instructions for Google to prompt the user to sign into their
     account.</p>";

    echo"<p>These two files were then added into my VM, and added to my web page by setting up a sing in button in 'index.html' 
    which directs the user here.</p>";

    //create a sign out button that will trigger the form to direct the user to index.html once logged out
    echo"<form method='post'>
           <input type='submit' name='signOut' value='Sign Out' />
         </form>";

} else{
    //if there is no access token in the session, redirect to the oauth2callback page which asks the users
    //to sign in with their google cresidentials
    $redirect_uri='http://'.$_SERVER['HTTP_HOST'].'/oauth2callback.php';
    header('Location: '.filter_var($redirect_uri, FILTER_SANITIZE_URL));
}
//create the functionality for the sign out button
//if sign out button pressed, destroy the session and direct the user to index.html page
if($_SERVER['REQUEST_METHOD'] === "POST" && isset($_POST['signOut'])){
    //revoke the client token so the user can't use the app unless they sign in again
    $client->revokeToken($_SESSION['access_token']);
    //destroy the current session
    session_destroy();
    //redirect the user to index.html using the header() function
    $redirect='http://'.$_SERVER['HTTP_HOST'].'/index.html';
    header('Location: '.filter_var($redirect, FILTER_SANITIZE_URL));

}
?>