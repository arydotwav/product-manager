const frases = [
    { titulo: "Deuteronomio 28:11", texto: "El Señor te concederá abundancia de bienes, en el fruto de tu vientre, en el fruto de tu ganado y en el fruto de tu tierra." },
    { titulo: "Salmos 1:3", texto: "Será como árbol plantado junto a corrientes de aguas, que da su fruto en su tiempo; su hoja no cae, y todo lo que hace, prosperará." },
    { titulo: "Proverbios 3:5-6", texto: "Confía en el Señor con todo tu corazón, y no te apoyes en tu propia comprensión; reconoce que en todos tus caminos él es quien te dará buen éxito." },
    { titulo: "3 Juan 1:2", texto: "Amado, ruego que seas prosperado en todo así como prospera tu alma, y que tengas buena salud." },
    { titulo: "Deuteronomio 4:9", texto: "Antes bien las enseñarás a tus hijos y a los hijos de tus hijos." },
    { titulo: "Filipenses 4:7", texto: "Que la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús" },
    { titulo: "Juan 14:27", texto: "La paz les dejo; mi paz les doy. Yo no se la doy a ustedes como la da el mundo. No se angustien ni se acobarden." },
    { titulo: "1 Juan 4:16", texto: "Y nosotros hemos llegado a conocer y hemos creído el amor que Dios tiene para nosotros. Dios es amor , y el que permanece en amor permanece en Dios y Dios permanece en él" },
    { titulo: "Isaías 49:15", texto: "¿Puede una madre olvidar a su niño de pecho, y dejar de amar al hijo que ha dado a luz? Aun cuando ella lo olvidara, ¡yo no te olvidaré!" },
    { titulo: "Filipenses 4:6-7", texto: "No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias. Y la paz de Dios, que sobrepasa todo entendimiento, cuidará sus corazones y sus pensamientos en Cristo Jesús." },
  ];
  
  const headerElement = document.getElementById("dynamic-header");
  
  const randomIndex = Math.floor(Math.random() * frases.length);
  headerElement.innerHTML = `
    <h3>${frases[randomIndex].titulo}</h3>
    <p>${frases[randomIndex].texto}</p>
  `;

  const frasesRestantes = frases.filter((_, index) => index !== randomIndex);
  
  let index = 0;
  
  function cambiarFrase() {
    headerElement.style.opacity = 0;
  
    setTimeout(() => {
      headerElement.innerHTML = `
        <h3>${frasesRestantes[index].titulo}</h3>
        <p>${frasesRestantes[index].texto}</p>
      `;
      index = (index + 1) % frasesRestantes.length;
  
      headerElement.style.opacity = 1;
    }, 1000);
  }
  

  setTimeout(() => {
    setInterval(cambiarFrase, 9000);
  }, 3000);
  