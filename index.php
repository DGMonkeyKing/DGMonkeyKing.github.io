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
<!DOCTYPE HTML>
<html>
	<head>
		<title>David Gómez Site</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<!--[if lte IE 8]><script src="assets/js/ie/html5shiv.js"></script><![endif]-->
		<link rel="stylesheet" href="assets/css/main.css" />
		<!--[if lte IE 8]><link rel="stylesheet" href="assets/css/ie8.css" /><![endif]-->
		<script type="text/javascript">
			 function showhideID(id, button) {
				var e = document.getElementById(id);
				e.style.display = (e.style.display == 'block') ? 'none' : 'block';
				e = document.getElementById(button);
				e.innerHTML = (e.innerHTML == 'Learn More') ? 'Interesting...' : 'Learn More';
			 }
			 function showhideCLASS(classs, button) {
				var e = document.getElementsByClassName(classs);
				for(var i = 0; i < e.length; i++)
					e[i].style.display = (e[i].style.display == 'block') ? 'none' : 'block';

				e = document.getElementById(button);
				if(e.innerHTML == 'Learn More') e.innerHTML = 'Interesting...';
				else if(e.innerHTML == 'Interesting...') e.innerHTML = 'Learn More';
				else if(e.innerHTML == 'Full Portfolio') e.innerHTML = 'That´s Enough';
				else if(e.innerHTML == 'That´s Enough') e.innerHTML = 'Full Portfolio';
			 }
		</script>
	</head>
	<body id="top">

		<!-- Header -->
			<header id="header">
				<a href="#" class="image avatar"><img src="images/avatar.jpg" alt="" /></a>
				<h1><strong>David Gómez</strong> </br> Freelancer videogame developer</br>
				and restless student of computer science.</h1>
			</header>

		<!-- Main -->
			<div id="main">

				<!-- One -->
					<section id="one">
						<header class="major">
							<h2>Hello there! Welcome to my site<br />
							and let me introduce myself...</h2>
						</header>
						<p>I'm a student of computer science at UCM in Spain. For ages I have been a videogames
						lover and, whenever I have some free time, I spend it on develop a game-idea or fill my head 
						with new ones by gaming. Still, I do not only focus on videogames, since I am also quite 
						interested in parallel programming and machine learning or A.I.</p>
						<p id="learnmore" style="display:none;">During my third year, I won the bronze medal in a nationwide parallel programing 
						contest in pairs in which I had to participate by myself representing my University 
						(<a href="http://luna.inf.um.es/2015/results.php">link to the contest results.</a>).</br></br>
						Thanks to the abilities and capacity I demonstrate in the contest, a professor of the Computing Department of my University took me as
						an intern to collaborate in projects related with parallel programming and library porting while I finish my studies during this year.</br> </br>
						I am currently working in various projects related with the thing listed above, but why don't you take 
						a look yourself? Below I list my projects that can be found in Github as well.</br></br>
						<strong>I invite you to browse the projects and to contact me!</strong></p>
						<ul class="actions">
							<li><a id="learn-more-button" href="javascript:showhideID('learnmore', 'learn-more-button')" class="button">Learn More</a></li>
						</ul>
					</section>

				<!-- Two -->
					<section id="two">
						<h2>All I am working on...</h2>
						<p>Here are the projects I'm working on. I will try to keep update the ones which are not uploaded on Github.</p>
						<div class="row">
							<article class="6u 12u$(xsmall) work-item">
								<a href="images/fulls/sample-1.png" class="image fit thumb"><img src="images/thumbs/sample-1.png" alt="" /></a>
								<h3>Spatial Sandbox</h3>
								<p>An open space game designed for full freedom gameplay and todemonstrate my knowledge with Unity3D.</p>
								<a href="https://github.com/DGMonkeyKing/Solar-System-Simulation" target="_blank">Link to the source</a>
							</article>
							<article class="6u 12u$(xsmall) work-item">
								<a href="images/fulls/Frogger.jpg" class="image fit thumb"><img src="images/thumbs/Frogger.jpg" alt="" /></a>
								<h3>Frogger Game</h3>
								<p>The old-school Frogger game develop with the engine of Galaga (In Javascript).</p>
								<a href="https://github.com/DGMonkeyKing/Frogger" target="_blank">Link to the source</a>
							</article>
							<article class="6u 12u$(xsmall) work-item">
								<a href="images/fulls/mainTitle.png" class="image fit thumb"><img src="images/thumbs/mainTitle.png" alt="" /></a>
								<h3>Super Mario Game</h3>
								<p>A Super Mario Game powered by Quintus engine to try this engine.</p>
								<a href="https://github.com/DGMonkeyKing/Super-Mario" target="_blank">Link to the source</a>
							</article>
						</div>
						<ul class="actions">
							<li><a id="full-port-button" href="javascript:showhideCLASS('fullport', 'full-port-button')" class="button">Full Portfolio</a></li>
						</ul>
					</section>

				<!-- Three -->
					<section id="three">
						<h2>Get In Touch</h2>
						<p>If you liked what you saw, don't hesitate to contact me. I'm currently looking for a job, so let's get in touch!</p>
						<div class="row">
							<div class="8u 12u$(small)">
								<form action="?" method="post">
									<?php if(!empty($feedback)) { ?>
									<p id="feedback"><?php echo $feedback; ?></p>
									<?php } ?>
									<div class="row uniform 50%">
										<div class="6u 12u$(xsmall)"><input type="text" name="name" id="name" placeholder="Name" /></div>
										<div class="6u$ 12u$(xsmall)"><input type="email" name="email" id="email" placeholder="Email*" /></div>
										<div class="12u$"><input type="text" name="subject" id="subject" placeholder="Subject*" /></div>
										<div class="12u$"><textarea name="message" id="message" placeholder="Message*" rows="4"></textarea></div>
									</div>
									<p>* Fields are obligatory.</p>
									<ul class="actions">
										<li><input type="submit" name="submit" value="Submit" /></li>
									</ul>
								</form>
							</div>
							<div class="4u$ 12u$(small)">
								<ul class="labeled-icons">
									<li>
										<h3 class="icon fa-home"><span class="label">Address</span></h3>
										Madrid, 28031<br />
										Spain
									</li>
									<li>
										<h3 class="icon fa-envelope-o"><span class="label">Email</span></h3>
										<a href="mailto:davidnew33@gmail.com">davidnew33@gmail.com</a>
									</li>
								</ul>
							</div>
						</div>
					</section>

				<!-- Four -->
				<!--
					<section id="four">
						<h2>Elements</h2>

						<section>
							<h4>Text</h4>
							<p>This is <b>bold</b> and this is <strong>strong</strong>. This is <i>italic</i> and this is <em>emphasized</em>.
							This is <sup>superscript</sup> text and this is <sub>subscript</sub> text.
							This is <u>underlined</u> and this is code: <code>for (;;) { ... }</code>. Finally, <a href="#">this is a link</a>.</p>
							<hr />
							<header>
								<h4>Heading with a Subtitle</h4>
								<p>Lorem ipsum dolor sit amet nullam id egestas urna aliquam</p>
							</header>
							<p>Nunc lacinia ante nunc ac lobortis. Interdum adipiscing gravida odio porttitor sem non mi integer non faucibus ornare mi ut ante amet placerat aliquet. Volutpat eu sed ante lacinia sapien lorem accumsan varius montes viverra nibh in adipiscing blandit tempus accumsan.</p>
							<header>
								<h5>Heading with a Subtitle</h5>
								<p>Lorem ipsum dolor sit amet nullam id egestas urna aliquam</p>
							</header>
							<p>Nunc lacinia ante nunc ac lobortis. Interdum adipiscing gravida odio porttitor sem non mi integer non faucibus ornare mi ut ante amet placerat aliquet. Volutpat eu sed ante lacinia sapien lorem accumsan varius montes viverra nibh in adipiscing blandit tempus accumsan.</p>
							<hr />
							<h2>Heading Level 2</h2>
							<h3>Heading Level 3</h3>
							<h4>Heading Level 4</h4>
							<h5>Heading Level 5</h5>
							<h6>Heading Level 6</h6>
							<hr />
							<h5>Blockquote</h5>
							<blockquote>Fringilla nisl. Donec accumsan interdum nisi, quis tincidunt felis sagittis eget tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan faucibus. Vestibulum ante ipsum primis in faucibus lorem ipsum dolor sit amet nullam adipiscing eu felis.</blockquote>
							<h5>Preformatted</h5>
							<pre><code>i = 0;

while (!deck.isInOrder()) {
print 'Iteration ' + i;
deck.shuffle();
i++;
}

print 'It took ' + i + ' iterations to sort the deck.';</code></pre>
						</section>

						<section>
							<h4>Lists</h4>
							<div class="row">
								<div class="6u 12u$(xsmall)">
									<h5>Unordered</h5>
									<ul>
										<li>Dolor pulvinar etiam magna etiam.</li>
										<li>Sagittis adipiscing lorem eleifend.</li>
										<li>Felis enim feugiat dolore viverra.</li>
									</ul>
									<h5>Alternate</h5>
									<ul class="alt">
										<li>Dolor pulvinar etiam magna etiam.</li>
										<li>Sagittis adipiscing lorem eleifend.</li>
										<li>Felis enim feugiat dolore viverra.</li>
									</ul>
								</div>
								<div class="6u$ 12u$(xsmall)">
									<h5>Ordered</h5>
									<ol>
										<li>Dolor pulvinar etiam magna etiam.</li>
										<li>Etiam vel felis at lorem sed viverra.</li>
										<li>Felis enim feugiat dolore viverra.</li>
										<li>Dolor pulvinar etiam magna etiam.</li>
										<li>Etiam vel felis at lorem sed viverra.</li>
										<li>Felis enim feugiat dolore viverra.</li>
									</ol>
									<h5>Icons</h5>
									<ul class="icons">
										<li><a href="#" class="icon fa-twitter"><span class="label">Twitter</span></a></li>
										<li><a href="#" class="icon fa-facebook"><span class="label">Facebook</span></a></li>
										<li><a href="#" class="icon fa-instagram"><span class="label">Instagram</span></a></li>
										<li><a href="#" class="icon fa-github"><span class="label">Github</span></a></li>
										<li><a href="#" class="icon fa-dribbble"><span class="label">Dribbble</span></a></li>
										<li><a href="#" class="icon fa-tumblr"><span class="label">Tumblr</span></a></li>
									</ul>
								</div>
							</div>
							<h5>Actions</h5>
							<ul class="actions">
								<li><a href="#" class="button special">Default</a></li>
								<li><a href="#" class="button">Default</a></li>
							</ul>
							<ul class="actions small">
								<li><a href="#" class="button special small">Small</a></li>
								<li><a href="#" class="button small">Small</a></li>
							</ul>
							<div class="row">
								<div class="6u 12u$(small)">
									<ul class="actions vertical">
										<li><a href="#" class="button special">Default</a></li>
										<li><a href="#" class="button">Default</a></li>
									</ul>
								</div>
								<div class="6u$ 12u$(small)">
									<ul class="actions vertical small">
										<li><a href="#" class="button special small">Small</a></li>
										<li><a href="#" class="button small">Small</a></li>
									</ul>
								</div>
								<div class="6u 12u$(small)">
									<ul class="actions vertical">
										<li><a href="#" class="button special fit">Default</a></li>
										<li><a href="#" class="button fit">Default</a></li>
									</ul>
								</div>
								<div class="6u$ 12u$(small)">
									<ul class="actions vertical small">
										<li><a href="#" class="button special small fit">Small</a></li>
										<li><a href="#" class="button small fit">Small</a></li>
									</ul>
								</div>
							</div>
						</section>

						<section>
							<h4>Table</h4>
							<h5>Default</h5>
							<div class="table-wrapper">
								<table>
									<thead>
										<tr>
											<th>Name</th>
											<th>Description</th>
											<th>Price</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Item One</td>
											<td>Ante turpis integer aliquet porttitor.</td>
											<td>29.99</td>
										</tr>
										<tr>
											<td>Item Two</td>
											<td>Vis ac commodo adipiscing arcu aliquet.</td>
											<td>19.99</td>
										</tr>
										<tr>
											<td>Item Three</td>
											<td> Morbi faucibus arcu accumsan lorem.</td>
											<td>29.99</td>
										</tr>
										<tr>
											<td>Item Four</td>
											<td>Vitae integer tempus condimentum.</td>
											<td>19.99</td>
										</tr>
										<tr>
											<td>Item Five</td>
											<td>Ante turpis integer aliquet porttitor.</td>
											<td>29.99</td>
										</tr>
									</tbody>
									<tfoot>
										<tr>
											<td colspan="2"></td>
											<td>100.00</td>
										</tr>
									</tfoot>
								</table>
							</div>

							<h5>Alternate</h5>
							<div class="table-wrapper">
								<table class="alt">
									<thead>
										<tr>
											<th>Name</th>
											<th>Description</th>
											<th>Price</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Item One</td>
											<td>Ante turpis integer aliquet porttitor.</td>
											<td>29.99</td>
										</tr>
										<tr>
											<td>Item Two</td>
											<td>Vis ac commodo adipiscing arcu aliquet.</td>
											<td>19.99</td>
										</tr>
										<tr>
											<td>Item Three</td>
											<td> Morbi faucibus arcu accumsan lorem.</td>
											<td>29.99</td>
										</tr>
										<tr>
											<td>Item Four</td>
											<td>Vitae integer tempus condimentum.</td>
											<td>19.99</td>
										</tr>
										<tr>
											<td>Item Five</td>
											<td>Ante turpis integer aliquet porttitor.</td>
											<td>29.99</td>
										</tr>
									</tbody>
									<tfoot>
										<tr>
											<td colspan="2"></td>
											<td>100.00</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</section>

						<section>
							<h4>Buttons</h4>
							<ul class="actions">
								<li><a href="#" class="button special">Special</a></li>
								<li><a href="#" class="button">Default</a></li>
							</ul>
							<ul class="actions">
								<li><a href="#" class="button big">Big</a></li>
								<li><a href="#" class="button">Default</a></li>
								<li><a href="#" class="button small">Small</a></li>
							</ul>
							<ul class="actions fit">
								<li><a href="#" class="button special fit">Fit</a></li>
								<li><a href="#" class="button fit">Fit</a></li>
							</ul>
							<ul class="actions fit small">
								<li><a href="#" class="button special fit small">Fit + Small</a></li>
								<li><a href="#" class="button fit small">Fit + Small</a></li>
							</ul>
							<ul class="actions">
								<li><a href="#" class="button special icon fa-download">Icon</a></li>
								<li><a href="#" class="button icon fa-download">Icon</a></li>
							</ul>
							<ul class="actions">
								<li><span class="button special disabled">Special</span></li>
								<li><span class="button disabled">Default</span></li>
							</ul>
						</section>

						<section>
							<h4>Form</h4>
							<form method="post" action="#">
								<div class="row uniform 50%">
									<div class="6u 12u$(xsmall)">
										<input type="text" name="demo-name" id="demo-name" value="" placeholder="Name" />
									</div>
									<div class="6u$ 12u$(xsmall)">
										<input type="email" name="demo-email" id="demo-email" value="" placeholder="Email" />
									</div>
									<div class="12u$">
										<div class="select-wrapper">
											<select name="demo-category" id="demo-category">
												<option value="">- Category -</option>
												<option value="1">Manufacturing</option>
												<option value="1">Shipping</option>
												<option value="1">Administration</option>
												<option value="1">Human Resources</option>
											</select>
										</div>
									</div>
									<div class="4u 12u$(small)">
										<input type="radio" id="demo-priority-low" name="demo-priority" checked>
										<label for="demo-priority-low">Low Priority</label>
									</div>
									<div class="4u 12u$(small)">
										<input type="radio" id="demo-priority-normal" name="demo-priority">
										<label for="demo-priority-normal">Normal Priority</label>
									</div>
									<div class="4u$ 12u(small)">
										<input type="radio" id="demo-priority-high" name="demo-priority">
										<label for="demo-priority-high">High Priority</label>
									</div>
									<div class="6u 12u$(small)">
										<input type="checkbox" id="demo-copy" name="demo-copy">
										<label for="demo-copy">Email me a copy of this message</label>
									</div>
									<div class="6u$ 12u$(small)">
										<input type="checkbox" id="demo-human" name="demo-human" checked>
										<label for="demo-human">I am a human and not a robot</label>
									</div>
									<div class="12u$">
										<textarea name="demo-message" id="demo-message" placeholder="Enter your message" rows="6"></textarea>
									</div>
									<div class="12u$">
										<ul class="actions">
											<li><input type="submit" value="Send Message" class="special" /></li>
											<li><input type="reset" value="Reset" /></li>
										</ul>
									</div>
								</div>
							</form>
						</section>

						<section>
							<h4>Image</h4>
							<h5>Fit</h5>
							<div class="box alt">
								<div class="row 50% uniform">
									<div class="12u$"><span class="image fit"><img src="images/fulls/05.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/01.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/02.jpg" alt="" /></span></div>
									<div class="4u$"><span class="image fit"><img src="images/thumbs/03.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/04.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/05.jpg" alt="" /></span></div>
									<div class="4u$"><span class="image fit"><img src="images/thumbs/06.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/03.jpg" alt="" /></span></div>
									<div class="4u"><span class="image fit"><img src="images/thumbs/02.jpg" alt="" /></span></div>
									<div class="4u$"><span class="image fit"><img src="images/thumbs/01.jpg" alt="" /></span></div>
								</div>
							</div>
							<h5>Left &amp; Right</h5>
							<p><span class="image left"><img src="images/avatar.jpg" alt="" /></span>Fringilla nisl. Donec accumsan interdum nisi, quis tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent. Donec accumsan interdum nisi, quis tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent.</p>
							<p><span class="image right"><img src="images/avatar.jpg" alt="" /></span>Fringilla nisl. Donec accumsan interdum nisi, quis tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent. Donec accumsan interdum nisi, quis tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent.</p>
						</section>

					</section>
				-->

			</div>

		<!-- Footer -->
			<footer id="footer">
				<ul class="icons">
					<li><a href="#" class="icon fa-twitter"><span class="label">Twitter</span></a></li>
					<li><a href="https://github.com/DGMonkeyKing" target="_blank" class="icon fa-github"><span class="label">Github</span></a></li>
					<li><a href="#" class="icon fa-linkedin"><span class="label">Linkedin</span></a></li>
					<li><a href="mailto:davidnew33@gmail.com" class="icon fa-envelope-o"><span class="label">Email me!</span></a></li>
				</ul>
				<ul class="copyright">
					<li>&copy; David Gomez Blanco</li><li>Design: <a href="http://html5up.net">HTML5 UP</a></li>
				</ul>
			</footer>

		<!-- Scripts -->
			<script src="assets/js/jquery.min.js"></script>
			<script src="assets/js/jquery.poptrox.min.js"></script>
			<script src="assets/js/skel.min.js"></script>
			<script src="assets/js/util.js"></script>
			<!--[if lte IE 8]><script src="assets/js/ie/respond.min.js"></script><![endif]-->
			<script src="assets/js/main.js"></script>

	</body>
</html>
