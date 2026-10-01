// Surface polygons are authored against the generated scene, in normalized image coordinates.
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const oval=(x,y,rx,ry)=>Array.from({length:28},(_,i)=>[x+Math.cos(i/28*Math.PI*2)*rx,y+Math.sin(i/28*Math.PI*2)*ry]);
export const CLEAN_SCENES={
 jet:{fabric:[oval(.28,.47,.205,.222),oval(.72,.47,.205,.222)],floor:[[[.406,.706],[.594,.706],[.698,.931],[.302,.931]]],glass:[oval(.289,.145,.064,.067),oval(.714,.145,.064,.067)],amenities:[['clean-blanket',.28,.56,84],['clean-towels',.72,.56,68],['world-sachet',.50,.82,50]]},
 rug:{fabric:[rect(.065,.04,.87,.9)],floor:[rect(.07,.045,.86,.89)],amenities:[]},
 sofa:{fabric:[rect(0,0,1,1)],floor:[[[.13,.46],[.86,.46],[.88,.65],[.12,.65]]],amenities:[['clean-cushion',.28,.40,88],['clean-cushion',.73,.40,80],['clean-blanket',.50,.57,100]]},
 bath:{fabric:[[[.271,.467],[.729,.467],[.802,.58],[.198,.58]]],floor:[[[.271,.467],[.729,.467],[.802,.58],[.198,.58]]],glass:[oval(.50,.215,.165,.17)],amenities:[['clean-towels',.29,.52,65],['world-perfume',.72,.52,42],['clean-spray',.77,.53,40]]},
 car:{fabric:[oval(.262,.655,.162,.234),oval(.738,.655,.162,.234)],floor:[[[.204,.323],[.422,.323],[.423,.388],[.19,.39],[.169,.432],[.153,.424]],[[.58,.323],[.795,.323],[.838,.424],[.816,.432],[.79,.39],[.578,.388]]],glass:[[[.225,.077],[.775,.077],[.805,.091],[.834,.184],[.71,.171],[.29,.171],[.166,.184],[.195,.091]]],amenities:[['clean-blanket',.27,.78,78],['world-handbag',.73,.77,62],['world-sachet',.50,.61,38]]},
 yacht:{fabric:[[[.17,.392],[.83,.392],[.855,.407],[.873,.521],[.889,.546],[.89,.626],[.11,.626],[.11,.546],[.127,.521],[.145,.407]]],floor:[[[.111,.691],[.889,.691],[.928,.746],[.905,.765],[.095,.765],[.072,.746]]],glass:[oval(.321,.261,.078,.063),oval(.679,.261,.078,.063)],amenities:[['clean-cushion',.26,.48,80],['clean-cushion',.74,.48,80],['clean-blanket',.49,.58,85]]},
};
export const SHOP_CATALOGS={
 boutique:{budget:115,categories:['Outfit','Shoes','Bag','Accessory'],items:[['world-party-dress',0,42],['romance-pearl-gown',0,65],['world-flats',1,24],['world-flats',1,32,0xe0b6ef],['world-handbag',2,28],['clean-bag',2,18],['world-hairpin',3,12],['world-ribbon',3,8]]},
 beauty:{budget:100,categories:['Lip color','Eye palette','Brush','Fragrance'],items:[['world-lipstick',0,22],['lipstick',0,16],['world-palette',1,38],['compact',1,25],['world-brush',2,18],['makeup-brush',2,24],['world-perfume',3,42],['dropper',3,27]]},
};
