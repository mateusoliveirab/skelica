/**
 * Spanish language patterns for prompt anatomy detection
 * Converted from backend/data/multilingual_patterns.yaml
 */

export const spanishPatterns = {
  role: [
    /(?:usted\s+)?es\s+(?:un|una|el|la)\s+[^\n.]{3,80}/i,
    /eres\s+(?:un|una|el|la)\s+[^\n.]{3,80}/i,
    /act[uú]a\s+como\s+(?:un|una|el|la)?\s*[^\n.]{3,80}/i,
    /finge\s+(?:ser|que\s+eres)\s+(?:un|una|el|la)?\s*[^\n.]{3,60}/i,
    /imagina\s+que\s+eres\s+(?:un|una|el|la)?\s*[^\n.]{3,60}/i,
    /comp[oó]rtate\s+como\s+(?:un|una|el|la)?\s*[^\n.]{3,60}/i,
    /responde\s+como\s+(?:un|una|el|la)?\s*[^\n.]{3,60}/i,
    /asume\s+el\s+rol\s+de\s+[^\n.]{3,60}/i,
    /tu\s+papel\s+es\s+(?:ser\s+)?(?:un|una|el|la)?\s*[^\n.]{3,60}/i,
    /como\s+(?:un|una)\s+(?:senior\s+|experto\s+en\s+|profesional\s+)?[^\n.,]{5,60}/i,
    /eres\s+(?:un|una)?\s*(?:experto|especialista|profesional|senior|l[ií]der)\s+[^\n.]{3,60}/i,
  ],

  context: [
    /(?:dado\s+que|dado\s+lo\s+siguiente|teniendo\s+en\s+cuenta\s+que)[^\n.]{5,150}/i,
    /en\s+el\s+contexto\s+de\s+[^\n.]{5,100}/i,
    /(?:asumiendo|suponiendo|considerando)\s+(?:que\s+)?[^\n.]{5,120}/i,
    /contexto[:\-]\s*[^\n]{5,200}/i,
    /antecedentes[:\-]\s*[^\n]{5,200}/i,
    /situaci[oó]n[:\-]\s*[^\n]{5,150}/i,
    /(?:estoy|estamos)\s+(?:construyendo|creando|desarrollando|trabajando\s+en|migrando|usando)\s+[^\n.]{5,120}/i,
    /(?:mi|nuestro|nuestra)\s+(?:empresa|equipo|proyecto|app|aplicaci[oó]n|producto|cliente|jefe|hija?)\s+[^\n.]{3,100}/i,
    /(?:la\s+)?(?:app|sistema|plataforma|proyecto|producto|servicio|aplicaci[oó]n)\s+(?:es|tiene|usa|procesa|maneja)\s+[^\n.]{5,100}/i,
    /(?:tengo|necesito|quiero|trabajo|estudio|uso)\s+[^\n.]{5,100}/i,
    /(?:mi|nuestro)\s+(?:objetivo|meta|problema|desaf[ií]o)\s+es\s+[^\n.]{5,100}/i,
    /estamos\s+(?:intentando|planeando|buscando)\s+[^\n.]{5,100}/i,
    /soy\s+(?:un|una)?\s*(?:estudiante|desarrollador|principiante|profesional)[^\n.]{0,80}/i,
    /tengo\s+\d+\s+a[ñn]os[^\n.]{0,60}/i,
  ],

  instruction: [
    /(?:por\s+favor[,\s]+)?(?:escriba|escribe|crea|genera|construye|haz|dise[ñn]a|desarrolla|produce|redacta)\s+[^\n.]{3,120}/i,
    /(?:por\s+favor[,\s]+)?(?:analiza|revisa|eval[uú]a|examina|inspecciona)\s+[^\n.]{3,100}/i,
    /(?:por\s+favor[,\s]+)?(?:explica|describe|resume|detalla|aclara|lista)\s+[^\n.]{3,100}/i,
    /(?:por\s+favor[,\s]+)?(?:identifica|encuentra|muestra|proporciona|dame)\s+[^\n.]{3,100}/i,
    /(?:por\s+favor[,\s]+)?(?:traduce|convierte|transforma|reescribe|refactoriza|mejora|corrige|edita)\s+[^\n.]{3,100}/i,
    /(?:por\s+favor[,\s]+)?(?:compara|calcula|resuelve|determina|recomienda|sugiere)\s+[^\n.]{3,100}/i,
    /tu\s+tarea\s+es\s+[^\n.]{3,120}/i,
    /tu\s+(?:objetivo|meta|trabajo|misi[oó]n)\s+es\s+[^\n.]{3,100}/i,
    /(?:necesito|quiero|me\s+gustar[ií]a)\s+(?:que\s+)?(?:me\s+ayudes\s+a\s+)?(?:escribir|crear|construir|analizar|explicar|dise[ñn]ar|generar)\s+[^\n.]{3,100}/i,
    /ay[uú]dame\s+(?:a\s+)?(?:escribir|crear|construir|analizar|entender|dise[ñn]ar|planear)\s+[^\n.]{3,100}/i,
    /puedes\s+(?:escribir|crear|analizar|explicar|ayudarme)\s+[^\n.]{3,100}/i,
    /podr[ií]as\s+(?:escribir|crear|analizar|explicar|ayudarme)\s+[^\n.]{3,100}/i,
  ],

  constraint: [
    /(?:no\s+uses?|no\s+utilices?|evita|no\s+hagas?|jam[aá]s|nunca)\s+[^\n.]{3,100}/i,
    /(?:no\s+debes?|no\s+puedes?|no\s+est[aá]\s+permitido)\s+[^\n.]{3,100}/i,
    /(?:l[ií]mita(?:\s+a)?|m[aá]ximo|no\s+m[aá]s\s+de|como\s+m[aá]ximo)\s+\d+[^\n.]{0,60}/i,
    /(?:m[ií]nimo|al\s+menos|por\s+lo\s+menos)\s+\d+[^\n.]{0,60}/i,
    /(?:menos\s+de|por\s+debajo\s+de|no\s+m[aá]s\s+que)\s+\d+\s+(?:palabras?|caracteres?|l[ií]neas?|p[aá]ginas?)[^\n.]{0,40}/i,
    /(?:mant[eé]n|deja)\s+(?:(?:la\s+)?respuesta\s+)?(?:corta?|breve|concis[ao]|sucint[ao])[^\n.]{0,60}/i,
    /(?:sin\s+(?:usar|utilizar)|excluyendo|excepto|sin\s+incluir)\s+[^\n.]{3,80}/i,
    /(?:solo|solamente|exclusivamente|[uú]nicamente)\s+(?:usa|usando|con|en)\s+[^\n.]{3,80}/i,
    /requisitos?[:\-]\s*[^\n]{5,200}/i,
    /restricciones?[:\-]\s*[^\n]{5,150}/i,
    /reglas?[:\-]\s*[^\n]{5,150}/i,
    /(?:debe|necesita|tiene\s+que|es\s+necesario)\s+(?:ser|tener|incluir|contener|usar)\s+[^\n.]{3,100}/i,
    /[-•*]\s+(?:debe|no|evita|incluye|excluye|limita)[^\n]{3,100}/i,
    /\d+\s+(?:estrategias|m[eé]todos|enfoques|maneras|soluciones|opciones|ideas|consejos|ejemplos|art[ií]culos|puntos|pasos|t[eé]cnicas|alternativas|recomendaciones|preguntas|respuestas|escenarios)\b/i,
    // Patrones de restricción conversacionales
    /nada\s+(?:muy\s+)?(?:comercial|formal|casual|t[eé]cnico|complejo|simple|largo|corto|complicado|avanzado|extravagante|gen[eé]rico|corporativo|clich[eé])[^\n.]{0,80}/i,
  ],

  example: [
    /(?:por\s+)?ejemplo[:\s][^\n]{3,200}/i,
    /por\s+ejemplo[:\s][^\n]{3,200}/i,
    /p\.ej\.?[:\s][^\n]{3,200}/i,
    /como\s+(?:por\s+ejemplo|este)[:\s][^\n]{3,150}/i,
    /como\s+este[:\s\n][^\n]{3,150}/i,
    /muestra[:\-]\s*[^\n]{3,200}/i,
    /entrada[:\-]\s*[^\n]{3,150}/i,
    /salida[:\-]\s*[^\n]{3,150}/i,
    /["'][^"']{3,100}["']\s*(?:→|->|=>)\s*["'][^"']{3,100}["']/i,
    /```[\s\S]{3,500}?```/i,
    /ahora\s+(?:reescribe|haz|aplica|intenta)[:\s][^\n]{3,150}/i,
    // Patrones de ejemplo conversacionales
    /aqu[ií]\s+tienes?\s+(?:un|una)?\s*ejemplo[^\n.]{0,200}/i,
    /aqu[ií]\s+tienes?\s+(?:mi|el|un)\s+(?:borrador|actual|antiguo|malo|existente|anterior|ejemplo)\s+(?:versi[oó]n|borrador|copia|texto|p[aá]rrafo|intento)[^\n.]{0,100}/i,
    /(?:como|parecido\s+a)\s+["'][^"']{5,150}["']/i,
    /(?:use|muestre|incluya|escriba|proporcione|d[eé])\s+(?:un|una)?\s*ejemplo\s+[^\n.?!]{3,100}/i,
    /algo\s+como\s+(?:(?:un|una|el|la)\s+)?[^\n.?]{5,80}/i,
  ],

  format: [
    /(?:retorna|proporciona|presenta|entrega)\s+(?:el\s+(?:resultado|respuesta)\s+)?(?:como|en|usando)\s+[^\n.]{3,80}/i,
    /(?:formatea|estructura|organiza|presenta)\s+(?:(?:la|el)\s+(?:respuesta|resultado))?\s+(?:como|en)\s+[^\n.]{3,80}/i,
    /formato[:\-]\s*[^\n]{3,100}/i,
    /formato\s+de\s+salida[:\-]\s*[^\n]{3,100}/i,
    /(?:como|en)\s+(?:un[a]?\s+)?(?:json|xml|yaml|csv|markdown|tabla|lista|lista\s+numerada|viñetas?)\b[^\n.]{0,60}/i,
    /(?:lista\s+(?:numerada|con\s+viñetas|ordenada|no\s+ordenada))\b[^\n.]{0,60}/i,
    /(?:usa|usando)\s+(?:la\s+)?(?:siguiente\s+)?(?:estructura|plantilla|esquema)[:\-]\s*[^\n]{3,150}/i,
    /(?:incluye|con)\s+(?:las?\s+)?(?:siguientes?\s+)?(?:secciones?|campos?|columnas?|encabezados?)[:\-]\s*[^\n]{3,150}/i,
    /organiza\s+(?:(?:la|el)\s+(?:respuesta|resultado))\s+(?:por|en|con)\s+[^\n.]{3,100}/i,
    /tabla[:\-]\s*[^\n]{3,100}/i,
    /\d+\s+(?:estrategias|m[eé]todos|enfoques|maneras|soluciones|opciones|ideas|consejos|ejemplos|art[ií]culos|puntos|pasos|t[eé]cnicas|alternativas|recomendaciones|preguntas|respuestas|escenarios)\b/i,
  ],

  audience: [
    /(?:p[uú]blico\s+)?objetivo[:\-]\s*[^\n]{3,100}/i,
    /destinado\s+(?:a|para)\s+[^\n.]{3,100}/i,
    /(?:escrito|desarrollado|creado|dise[ñn]ado|dirigido)\s+(?:a|para)\s+[^\n.]{3,100}/i,
    /para\s+(?:un[a]?\s+)?(?:principiante|intermedio|avanzado|experto|no\s+t[eé]cnico|t[eé]cnico|junior|senior)\s+[^\n.]{0,60}/i,
    /(?:principiante|lego|no\s+t[eé]cnico|p[uú]blico\s+general)[- ]friendly\b[^\n.]{0,60}/i,
    /(?:mi\s+)?(?:p[uú]blico|lectores?|usuarios?|espectadores?)\s+(?:son|es|incluye)\s+[^\n.]{3,80}/i,
  ],

  tone: [
    /tono[:\-]\s*[^\n]{3,100}/i,
    /estilo[:\-]\s*[^\n]{3,100}/i,
    /voz[:\-]\s*[^\n]{3,100}/i,
    /(?:escribe|responde|suena|s[eé]|mant[eé]n)\s+(?:un\s+tono\s+)?(?:formal|informal|casual|profesional|amigable|conversacional|t[eé]cnico|simple|humorístico|serio|emp[aá]tico|asertivo|persuasivo|neutro|acad[eé]mico|creativo)\b/i,
    /(?:tono|estilo|voz)\s+(?:formal|informal|casual|profesional|amigable|conversacional|t[eé]cnico|humorístico|serio|emp[aá]tico|asertivo|neutro|acad[eé]mico)\b/i,
    /lenguaje\s+(?:formal|informal|t[eé]cnico|simple|accesible)\b/i,
    /(?:tono|escritura)\s+(?:apasionado|motivador|alentador)\b/i,
  ],
};
