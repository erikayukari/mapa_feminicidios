let mapaMalha;
let mapaDados;

// como a função carrega um arquivo, usamos o termo async
// para indicar que ela vai esperar o carregamento
async function loadMapData(){
    let mapaUrl='https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&qualidade=intermediaria&intrarregiao=UF';
    let dadosUrl='feminicidios_uf_forum_br_seguranca_publica.json';


    // chama os dados da malha 
    mapaMalha = await d3.json(mapaUrl);
    mapaDados = await d3.json(dadosUrl);

    // seleciona o svg com id #mapa 
    let svg = d3.select("#mapa");
    let projecao = d3.geoMercator();
    mapaPaths = d3.geoPath().projection(projecao)
    let centerLatLng = [-52.7778191, -16.5476006];
    let width = 800, height=800;

    svg.attr("width", width); 
    svg.attr("height", height);
    svg.attr("viewBox", "0 0 "+width+" "+ height);
    svg.attr("preserveAspectRatio", "xMidYMid meet");

    let grupo = svg.append("g");
    let geometrias = topojson.feature(mapaMalha, mapaMalha.objects.BRUF).features;

    projecao.center(centerLatLng);
    projecao.scale(900);
    projecao.translate([width/2, height/2]);

    // define variação das cores
    var calculaCor = d3.scaleLinear()
    .domain([0, 32])
    .range(["#CCEEFF", "#FF0000"])

    grupo.selectAll("path")
        .data(geometrias)
        .enter().append("path")
        .attr("d", mapaPaths)
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

function desmarcaUF(elemento){
    d3.select(elemento).classed("ativo", false)
}

loadMapData();