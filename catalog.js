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
  {name:'Polo y pantalón recto',label:'LOOK 01',copy:'Polo piqué marino con pantalón crudo.',photo:'look01',items:[{id:'polo',x:48,y:34},{id:'pantalon',x:57,y:60}]},
  {name:'Chaleco y buzo',label:'LOOK 02',copy:'Chaleco negro sobre el buzo marfil, con pantalón crudo.',photo:'look02',items:[{id:'chaleco',x:43,y:36},{id:'tejido',x:61,y:45},{id:'pantalon',x:54,y:64}]},
  {name:'Polo de manga larga',label:'LOOK 03',copy:'Polo marino de manga larga con pantalón crudo.',photo:'campana',items:[{id:'cuello-navy',x:50,y:42},{id:'pantalon',x:52,y:74}]},
  {name:'Oxford sobre remera',label:'LOOK 04',copy:'Camisa Oxford azul claro sobre una remera grafito.',photo:'look04',items:[{id:'oxford',x:64,y:36},{id:'remera',x:47,y:29},{id:'pantalon',x:48,y:62}]}
 ]
};
