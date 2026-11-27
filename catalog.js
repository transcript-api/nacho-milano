'use strict';
window.NM_BUILD={
 demo:true,
 products:[
  {id:'polo',name:'Polo de manga corta',category:'Polos',line:'Cuello de dos botones',description:'Polo de manga corta en piqué, con dos botones en el cuello.',detail:'Corte recto y mangas con puño.',colors:[['Marino noche','polo','#181c27'],['Humo','polo-humo','#48484a']],sizes:['S','M','L','XL']},
  {id:'pantalon',name:'Pantalón Riviera',category:'Pantalones',line:'Corte recto y cintura ajustable',description:'Pantalón de pierna recta en color crudo.',detail:'Cintura ajustable con cordón del mismo color.',colors:[['Crudo','pantalon','#e2dace']],sizes:['38','40','42','44']},
  {id:'tejido',name:'Buzo con cierre',category:'Buzos',line:'Cuello alto y cierre corto',description:'Buzo de punto trenzado con cuello alto y medio cierre.',detail:'El punto continúa en las mangas y termina en puños acanalados.',colors:[['Marfil','tejido','#ebe4d5'],['Grafito','tejido-grafito','#353537']],sizes:['S','M','L','XL']},
  {id:'chaleco',name:'Chaleco acolchado',category:'Chalecos',line:'Cuello alto',description:'Chaleco negro acolchado, con cuello alto.',detail:'Cierre frontal y paneles con costuras horizontales.',colors:[['Negro','chaleco','#1b1b1b']],sizes:['S','M','L','XL']},
  {id:'remera',name:'Remera Forma',category:'Remeras',line:'Cuello redondo, caída recta',description:'Remera grafito de manga corta y cuello redondo.',detail:'Corte recto. Podés usarla sola o debajo del chaleco.',colors:[['Grafito','remera','#39393a']],sizes:['S','M','L','XL']},
  {id:'oxford',name:'Camisa Oxford',category:'Camisas',line:'Cuello abotonado, azul hielo',description:'Camisa Oxford de manga larga en azul claro.',detail:'Cuello y puños con botones.',colors:[['Azul hielo','oxford','#bdcbd8']],sizes:['S','M','L','XL']},
  {id:'cuello-navy',name:'Polo de manga larga',category:'Polos',line:'Cuello abierto',description:'Polo marino de manga larga en punto fino.',detail:'Cuello abierto y terminación acanalada en puños y bajo.',colors:[['Marino','cuello-navy','#171f30']],sizes:['S','M','L','XL']}
 ],
 looks:[
  {
    "name": "Swell y lino",
    "copy": "Camisa Swell negra con pantalón de lino blanco.",
    "photo": "coleccion-detalles/look-swell",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-swell",
        "color": "Preto",
        "x": 50,
        "y": 34
      },
      {
        "id": "nm-calca-de-linho-com-elastano",
        "color": "Branco",
        "x": 50,
        "y": 62
      }
    ],
    "label": "LOOK 01"
  },
  {
    "name": "Rústic y short de lino",
    "copy": "Camisa Rústic Safari con short de lino Natural.",
    "photo": "coleccion-detalles/look-rustic",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-rustic",
        "color": "Safari",
        "x": 50,
        "y": 34
      },
      {
        "id": "nm-short-linho-ultra-premium",
        "color": "Natural",
        "x": 50,
        "y": 62
      }
    ],
    "label": "LOOK 02"
  },
  {
    "name": "Swell Off y pantalón negro",
    "copy": "Camisa Swell Off con pantalón de lino negro.",
    "photo": "coleccion-detalles/look-off",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-swell",
        "color": "OFF",
        "x": 50,
        "y": 34
      },
      {
        "id": "nm-calca-de-linho-com-elastano",
        "color": "Preto",
        "x": 50,
        "y": 62
      }
    ],
    "label": "LOOK 03"
  },
  {
    "name": "Azul claro y lino natural",
    "copy": "Camisa Rústic Azul Claro con short de lino Natural.",
    "photo": "coleccion-detalles/look-azul",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-rustic",
        "color": "Azul Claro",
        "x": 50,
        "y": 34
      },
      {
        "id": "nm-short-linho-ultra-premium",
        "color": "Natural",
        "x": 50,
        "y": 62
      }
    ],
    "label": "LOOK 04"
  },
  {
    "name": "Camisa Swell y pantalón de lino",
    "label": "LOOK 05",
    "copy": "Camisa Swell en crudo con pantalón de lino natural.",
    "photo": "look-coleccion-01",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-swell",
        "x": 50,
        "y": 33,
        "color": "OFF"
      },
      {
        "id": "nm-calca-de-linho-com-elastano",
        "x": 50,
        "y": 63,
        "color": "Natural"
      }
    ]
  },
  {
    "name": "Polo de punto y short de lino",
    "label": "LOOK 06",
    "copy": "Polo de punto marfil con short de lino natural.",
    "photo": "look-coleccion-02",
    "draft": true,
    "items": [
      {
        "id": "nm-polo-trico-modelo-01",
        "x": 50,
        "y": 33,
        "color": "Off White"
      },
      {
        "id": "nm-short-linho-ultra-premium",
        "x": 50,
        "y": 63,
        "color": "Natural"
      }
    ]
  },
  {
    "name": "Camisa Rústic y short de sarja",
    "label": "LOOK 07",
    "copy": "Camisa azul marino con short de sarja negro.",
    "photo": "look-coleccion-03",
    "draft": true,
    "items": [
      {
        "id": "nm-camisa-rustic",
        "x": 50,
        "y": 33,
        "color": "Marinho"
      },
      {
        "id": "nm-short-sarja",
        "x": 50,
        "y": 63,
        "color": "Preto"
      }
    ]
  },
  {
    "name": "Remera azul y short negro",
    "label": "LOOK 08",
    "copy": "Remera deportiva azul con short de entrenamiento negro.",
    "photo": "look-coleccion-04",
    "draft": true,
    "items": [
      {
        "id": "nm-camiseta-fitness-poliester",
        "x": 50,
        "y": 33,
        "color": "Azul"
      },
      {
        "id": "nm-short-gym-poliamida",
        "x": 50,
        "y": 63,
        "color": "Preto"
      }
    ]
  }
]
};
