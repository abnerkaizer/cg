var mMatrix = mat4.create();   

var mMatrixPilha = []; 
var vMatrix = mat4.create();    
var pMatrix = mat4.create();
//Teclado
var xRot = 0;
var xVelo = 0;

var yRot = 0;
var yVelo = 0;

var z = -12.0;

var filtro = 0;

//Piramide
var piramideVertexPositionBuffer;
var piramideVertexColorBuffer;

//Cabeça
var squareVertexPositionBuffer;
var skinVertexColorBuffer;

//Dorso
var dorsoVertexColorBuffer;

//Braços
var armVertexPositionBuffer;

//Pernas
var legVertexPositionBuffer;
//Olhos
var eyeVertexPositionBuffer;
var eyeVertexColorBuffer;

//Angulos de rotação
var rPiramide = 0;

// Iniciar o ambiente quando a página for carregada
$(function(){
    iniciaWebGL();
});
        
function iniciaWebGL(){
    var canvas = $('#canvas-webgl')[0];
    
    iniciarGL(canvas);                                 /* Definir como um canvas 3D */
    iniciarShaders();                                  /* Obter e processar os Shaders */
    iniciarBuffers();                                  /* Enviar o triângulo e quadrado na GPU */
    iniciarAmbiente();                                 /* Definir background e cor do objeto */
    tick();                                            /* Usar os itens anteriores e desenhar */
    document.onkeydown = eventoTeclaPress;
  	document.onkeyup = eventoTeclaSolta;
}

function iniciarGL(canvas){
    try{
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.viewportWidth  = canvas.width;
        gl.viewportHeight = canvas.height;
    }
    catch(e){
        if(!gl)
            alert("Não pode inicializar WebGL, desculpe");
    }
}

var shaderProgram;
function iniciarShaders(){

    var vertexShader = getShader(gl, "#shader-vs");     /* Criar os objetos shaders */
    var fragmentShader = getShader(gl, "#shader-fs");   /* e compilá-los. */
    
    shaderProgram = gl.createProgram();                 /* Criar o programa que */
    gl.attachShader(shaderProgram, vertexShader);       /* associará os shaders */
    gl.attachShader(shaderProgram, fragmentShader);     /* usando a função attachShader */
    gl.linkProgram(shaderProgram);
    
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Não pode inicializar shaders");
    }
    
    gl.useProgram(shaderProgram);   /* Chamando a função 'useProgram', */

    /* podemos referenciar todos os attributes e uniforms dos shaders */
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);   

    /* Depois obtemos as referências dos uniforms, que nesse caso são as matrizes MVP */
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");    /* Elas são simples números inteiros. */
    shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
    shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
       
}

function getShader(gl, id){ /* Identificador e o contexto webgl */
    /* Compilar os shaders, chamada para cada shader na função iniciarShaders */

    /* Captura a tag script que contenha o script do shader */
    var shaderScript = $(id)[0]; 
    if(!shaderScript){
        return null;
    }
    
    /* Capturamos o objeto representando o texto dentro da script */
    var str = "";
    var k = shaderScript.firstChild;
    while(k){
        if(k.nodeType == 3)             /*  É um texto?  */
            str += k.textContent;       /* Adicionamos seu conteúdo a uma variável de saída */
        k = k.nextSibling;
    }
    
    /* Aqui criamos o objeto do shader dentro do contexto */
    var shader;
    if(shaderScript.type == "x-shader/x-fragment"){         /* De acordo com seu tipo */
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if(shaderScript.type == "x-shader/x-vertex"){    /* De acordo com seu tipo */
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else{
        return null;
    }
    
    /* Estamos dizendo ao contexto que o código desse objeto 
        shader é o texto do script que capturamos */
    gl.shaderSource(shader, str);
    gl.compileShader(shader);       /* Em seguida compilamos (ela é enviada para a GPU) */
    
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){  /* Perguntamos se a compilação foi um sucesso */
        alert(gl.getShaderInfoLog(shader));                 /* Alertando-nos em caso de problema. */
        return null;
    }

    return shader;

}

function iniciarBuffers(){
    
    /*Para o triângulo, precisamos de 3 vértices 
    (guardado em numItems) de 3 dimensões (guardado 
    em itemSize).                               */
    piramideVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, piramideVertexPositionBuffer);
    
    var vertices = [
        // Frente
          0.0,  1.0,  0.0,
        -1.0, -1.0,  1.0,
          1.0, -1.0,  1.0,
        // Direita
          0.0,  1.0,  0.0,
          1.0, -1.0,  1.0,
          1.0, -1.0, -1.0,
        // Trás
          0.0,  1.0,  0.0,
          1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
        // Esquerda
          0.0,  1.0,  0.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    piramideVertexPositionBuffer.itemSize = 3;
    piramideVertexPositionBuffer.numItems = 12;

    piramideVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, piramideVertexColorBuffer);
    var cores = [
        // Frente
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        // Direita
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        // Trás
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        // Esquerda
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cores), gl.STATIC_DRAW);
    piramideVertexColorBuffer.itemSize = 4;
    piramideVertexColorBuffer.numItems = 12;

    //Cabeça
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [1.0,1.0,0.0, -1.0,1.0,0.0, 1.0,-1.0,0.0, -1.0,-1.0,0.0];
    
    /* STATIC_DRAW significa que não iremos jogar
    os dados da GPU para a CPU, apenas da CPU para 
    a GPU.                                      */
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    skinVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    cores = []
    for (var i=0; i < 4; i++) {
        cores = cores.concat([1.0, 0.827, 0.709, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cores), gl.STATIC_DRAW);
    skinVertexColorBuffer.itemSize = 4;
    skinVertexColorBuffer.numItems = 4;

    //Cor do dorso
    dorsoVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    cores = []
    for (var i=0; i < 4; i++) {
        cores = cores.concat([0.0, 0.0, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cores), gl.STATIC_DRAW);
    dorsoVertexColorBuffer.itemSize = 4;
	dorsoVertexColorBuffer.numItems = 4;

	//Braços
	armVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    vertices = [1.0,1.0,0.0, -1.0,1.0,0.0, 1.0,-1.0,0.0, -1.0,-1.0,0.0];
    /* STATIC_DRAW significa que não iremos jogar
    os dados da GPU para a CPU, apenas da CPU para 
    a GPU.                                      */
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    armVertexPositionBuffer.itemSize = 3;
    armVertexPositionBuffer.numItems = 4;
    //Pernas
    legVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    vertices = [1.0,1.0,0.0, -1.0,1.0,0.0, 1.0,-1.0,0.0, -1.0,-1.0,0.0];
    /* STATIC_DRAW significa que não iremos jogar
    os dados da GPU para a CPU, apenas da CPU para 
    a GPU.*/
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    legVertexPositionBuffer.itemSize = 3;
    legVertexPositionBuffer.numItems = 4;

   	//Olhos
   	eyeVertexPositionBuffer = gl.createBuffer();
   	gl.bindBuffer(gl.ARRAY_BUFFER,eyeVertexPositionBuffer);
   	vertices = [0.1,0.1,0.0, -0.1,0.1,0.0, 0.1,-0.1,0.0, -0.1,-0.1,0.0];
   	/* STATIC_DRAW significa que não iremos jogar
    os dados da GPU para a CPU, apenas da CPU para 
    a GPU.                                      */
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    eyeVertexPositionBuffer.itemSize = 3;
    eyeVertexPositionBuffer.numItems = 4;

    eyeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    cores = []
    for (var i=0; i < 4; i++) {
        cores = cores.concat([0.0, 0.0, 0.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cores), gl.STATIC_DRAW);
    eyeVertexColorBuffer.itemSize = 4;
	eyeVertexColorBuffer.numItems = 4;
}	

function iniciarAmbiente(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  /* Limpar a tela usando */
    
    /* Z-Buffer simplesmente descarta o fragmento 
    mais longe da câmera (coordenada Z menor), e usa 
    o fragmento mais perto */
    gl.enable(gl.DEPTH_TEST);           /* Habilitando o teste Z-Buffer */
}
function mPushMatrix() {
    var copy = mat4.clone(mMatrix);
    mMatrixPilha.push(copy);
}
function mPopMatrix() {
    if (mMatrixPilha.length == 0) {
      throw "inválido popMatrix!";
    }
    mMatrix = mMatrixPilha.pop();
}
function degToRad(graus) {
  return graus * Math.PI / 180;
}
function desenharCena(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(mMatrix);
    mat4.identity(vMatrix);
    
    // Chapeu
    var translation = vec3.create();
    vec3.set (translation, 0.0, 4.0, z); 
    mat4.translate(mMatrix, mMatrix, translation);
    //Rotação
    mPushMatrix();
    mat4.rotate(mMatrix, mMatrix, degToRad(xRot), [1, 0, 0]);
	mat4.rotate(mMatrix, mMatrix, degToRad(yRot), [0, 1, 0]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, piramideVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, piramideVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, piramideVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, piramideVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, piramideVertexPositionBuffer.numItems);

    mPopMatrix();
    
    //Cabeça
    vec3.set (translation, 0.0, -2.1, 0.0); 
    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, skinVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mPopMatrix();
    //Dorso
    vec3.set (translation, 0.0, -2.0, 2.5); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 0.0, -1.0, 0.0); 
    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mPopMatrix();
    
    //Braço direito
    vec3.set (translation, -3.5, 2.4, -15.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, -2.0, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, -2.0, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    
    //Braço esquerdo
    vec3.set (translation, 11.0, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 2.0, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 2.0, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, armVertexPositionBuffer.numItems);
    mPopMatrix();
    
    //Mão direita
    vec3.set (translation, -16.0, 0.0, 2.5); 
    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, skinVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mPopMatrix();
    
    //Mão esquerda
    vec3.set (translation, 16.0, 0.0, 0.0); 
    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, skinVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mPopMatrix();
    
    //Perna Direita

    vec3.set (translation, -8.83, -7.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 0.0, -2.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 0.0, -1.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    //Perna esquerda

    vec3.set (translation, 2.7, 3.0, -0.5); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 0.0, -2.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
    vec3.set (translation, 0.0, -1.2, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, dorsoVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, dorsoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    //Pé direito

	vec3.set (translation, -2.65, -0.8, 2.5); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, skinVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    //Pé esquerdo

    vec3.set (translation, 2.63, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, legVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, skinVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, skinVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
    //Olhos e boca
    //Olho esquerdo
    vec3.set (translation, -0.9, 12.0, 9.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    //Olho direito
    vec3.set (translation, -0.9, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    //Boca
    boca(translation);
}
var ultimo = 0;
function animar()
{
    var agora = new Date().getTime();
    if(ultimo != 0)
    {
      var diferenca = agora - ultimo;
        xRot  += ((xVelo*diferenca)/1000.0) % 360.0;
		yRot  += ((yVelo*diferenca)/1000.0) % 360.0;
    }
    ultimo = agora;
}
function setMatrixUniforms(){
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
}
function tick()
{
  requestAnimFrame(tick);
  tratarTeclado();
  desenharCena();
  animar();
}
var teclasPressionadas = {};

function eventoTeclaPress(evento) {
  teclasPressionadas[evento.keyCode] = true;

  if (String.fromCharCode(evento.keyCode) == "F")
    filtro = (filtro+1) % 3;
}

function eventoTeclaSolta(evento) {
  teclasPressionadas[evento.keyCode] = false;
}
function tratarTeclado() {
  if (teclasPressionadas[33]) {
    // Page Up
    z -= 0.05;
  }
  if (teclasPressionadas[34]) {
    // Page Down
    z += 0.05;
  }
  if (teclasPressionadas[37]) {
    // Esquerda
    yVelo -= 1;
  }
  if (teclasPressionadas[39]) {
    // Direita
    yVelo += 1;
  }
  if (teclasPressionadas[38]) {
    // Cima
    xVelo -= 1;
  }
  if (teclasPressionadas[40]) {
    // Baixo
    xVelo += 1;
  }
}

function boca(translation){
	vec3.set (translation, -0.1, -1.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();

    vec3.set (translation, 0.1, 0.0, 0.0); 

    mat4.translate(mMatrix, mMatrix, translation);
    mPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, eyeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, eyeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, legVertexPositionBuffer.numItems);
    mPopMatrix();
}