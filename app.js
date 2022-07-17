let mapaMalha;
let mapaDados;

// como a função carrega um arquivo, usamos o termo async
// para indicar que ela vai esperar o carregamento
async function loadMapData(){
    // endereço da malha do BR, por estado, na API do IBGE
    let mapaUrl='https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&qualidade=intermediaria&intrarregiao=UF';
    //endereço dos dados sobre a malha
    let dadosUrl='feminicidios_uf_forum_br_seguranca_publica.json';

    // carrega a malha com função que usa fetch por trás. Usamos o await porque o carregamento por demorando, então esta condição aguarda até que esteja completa a função
    mapaMalha = await d3.json(mapaUrl);
    // carrega dados topológicos - latitude e longitude, em formato json- da malha 
    mapaDados = await d3.json(dadosUrl);

    // usa a biblioteca d3.js para selecionar o svg com id #mapa 
    let svg = d3.select("#mapa");
    let projecao = d3.geoMercator();
    //insere em uma variável os caminhos [desenhos] das coordenadas usando a projeção criada acima
    mapaPaths = d3.geoPath().projection(projecao)
    //encontro as coordenadas do centro do meu mapa, via google maps ou outro meio, e as insiro em uma variável [com ordem invertida]
    let centerLatLng = [-52.7778191, -16.5476006];
    let width = 800, height=800;

    svg.attr("width", width); 
    svg.attr("height", height);
    //adiciono 2 propriedades que deixam o código responsivo
    svg.attr("viewBox", "0 0 "+width+" "+ height);
    svg.attr("preserveAspectRatio", "xMidYMid meet");

    //cria um elemento do tipo <g> via javascript 
    let grupo = svg.append("g");
    let geometrias = topojson.feature(mapaMalha, mapaMalha.objects.BRUF).features;

    // centraliza o mapa a partir das coordenadas que subi anteriormente 
    projecao.center(centerLatLng);
    projecao.scale(1000);
    //divide dois eixos para fazer a centralização
    projecao.translate([width/2, height/2]);

    // define escala de cores do mapa
    var calculaCor = d3.scaleLinear()
    .domain([0.6, 1.6])
    .range(["#FFF5F0", "#A00014"])

    //grupo.selectAll("path")
        .data(geometrias)
        .enter().append("path")
        //''d'' é propriedade do d3 para coordenadas. aqui os caminhos do mapa são criados de fato 
        .attr("d", mapaPaths)
        // digo que a classe de cada caminho se chamará uf 
        .attr("class", "uf")
        .attr("id", (d) => d.properties.codarea)
        .style("fill", function(d){
            // pega o código da área de cada elemento
            let codigo = d.properties.codarea;
            let cor;
            
            // filtra os dados para pegar somente o item do json
            // que tem o código da área
            let dadoDoEstado = mapaDados.filter(function(item){
                return item.id == codigo;
            }); 
            if(dadoDoEstado[0]){ 
                // calcular valor pela taxa
                cor = calculaCor(dadoDoEstado[0].taxa)
            }
            return cor || '#fff';
        })
        .attr("stroke-width", 1)
        .attr("stroke", 'rgb(0,0,0,0.2)')
        .on("mouseover",function(event, data) {
            desmarcaUF(document.querySelector('uf.ativo'));
            marcaUF(event.target, data);
        })
        .on("mouseout",function(event){
            desmarcaUF(event.target);
        });
}



function marcaUF(elemento, dados){
    let codigo = dados.properties.codarea;
    let dadosUF = mapaDados.filter(function(item){
        return item.id == codigo;
    });

    let nome = dadosUF[0].nome;
    let taxa = dadosUF[0].taxa
    d3.select(elemento).classed("ativo", true);    
    d3.select('#uf-titulo').node().textContent = nome + " teve taxa de " + parseFloat(taxa).toFixed(1) + " feminicídios por 100 mil mulheres em 2021.";
}

///tira classe ativo do elemento 
function desmarcaUF(elemento){
    d3.select(elemento).classed("ativo", false)
}

loadMapData();
