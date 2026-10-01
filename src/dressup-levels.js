// Append-only campaign entries: existing save indices and the 4/29 swap stay intact.
const themes=[
 ['garden','Garden Brunch','A peach blossom afternoon','A dress in bloom','The cozy little layer','Flowers for the finishing touch'],
 ['city','City Chic','A stroll through the city','A little lilac style','Ready for the city','Your own signature style'],
 ['seaside','Seaside Afternoon','Sunshine and sea breezes','A drop of sunshine','Dress for the sea breeze','A little seaside charm'],
 ['evening','Evening in Velvet','Your evening begins here','A lovely evening dress','Soft layers, lovely shoes','The final pearl details'],
];
export const DRESSUP_LEVELS=themes.map(([key,name,subtitle,dress,layers,accessories])=>{
 const prefix=`world-outfit-${key}`;
 return{id:`outfit-${key}`,name,subtitle,kind:'workshop',character:'cat',hero:`${prefix}-finished`,color:0xdba7ca,
  outfit:{prefix,base:`${prefix}-base`,states:{dress:`${prefix}-dressed`,layers:`${prefix}-layered`,accessorize:`${prefix}-finished`}},
  steps:[
   {name:dress,hint:'Drag the dress onto her outfit outline.',mode:'workshop',mechanic:'dress',tool:`${prefix}-dress`,seconds:12},
   {name:layers,hint:'Place the jacket and shoes on their glowing outlines.',mode:'workshop',mechanic:'layers',tool:`${prefix}-jacket`,seconds:12},
   {name:accessories,hint:'Add her bag and hair clip to complete the look.',mode:'workshop',mechanic:'accessorize',tool:`${prefix}-clip`,seconds:12},
  ]};
});
export const DRESSUP_ASSETS=DRESSUP_LEVELS.flatMap(l=>['base','dressed','layered','finished','dress','jacket','shoes','bag','clip'].map(s=>`${l.outfit.prefix}-${s}`));
