#!/bin/bash
{
echo '<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>شجرة الإيمان — Shajara Al-Iman</title>
<meta name="description" content="Shajara Al-Iman — Application de suivi spirituel islamique avec arbre de foi interactif">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>'
cat parts/styles.css
echo '</style>
</head>
<body>'
cat parts/body.html
echo '<script>'
cat parts/api.js
cat parts/script1.js
cat parts/script2.js
cat parts/script3.js
echo '</script>
</body>
</html>'
} > shajara-v4.html
echo "Done: $(wc -l < shajara-v4.html) lines"
