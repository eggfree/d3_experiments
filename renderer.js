/** RENDER.JS
JE -- this is my more encapsulated test file for rendering the mm charts.
*/
 var je_mm = {}
 
 je_mm.clusterVis = function (el_svg) {

  var t = this;


  

  /** CONSTSTANTS -- 
  right now just an oobject/hash of renderers  
  I'll replace this with individual renerer files, usin includes/dependencies ecma 2015 style */
  
  this.renderers   = {
    "links":      render_listings_as_dots,
    "identity": render_links_between_identities
    },
    defaultRenderer = this.renderers[0];
  

  /*** VARIABLES
  these will be moved to a namespaced funciton in the process of furthering the prototype**/
  

  /** performance tuning for sim **/
  var  simlength   = 40,
       simstate    = 0;

  /** EXTRACTED FROM DOM NODE **/
  var svg         = d3.select("#" + el_svg)

  var width       = +svg.attr("offsetWidth"),
      height      = +svg.attr("offsetHeight"),
      nodeSrc     = svg.attr("nodes"),
      linkSrc     = svg.attr("links"),
      render      = this.renderers[svg.attr("renderer")]
      console.log (svg.attr("renderer"))

  /* these are datastructures consumed by D3, all in format of  [{},{} ... {}]*/
  var nodes,                  /* raw: all detected nodes */
      links,                  /* raw: all source target links */
      id_links,               /* a list of links with only id information, weighted by #of connecting listings.*/
      id_nodes,
      obj_nodes       

      /* keep simulation from running forevere*/

        extents    = { x1:width,
                       x2:0,
                       y1:height,
                       y2:0 }
  var simulation 



  function sim1 () {
    return simulation = d3.forceSimulation()
    .force ("collide",d3.forceCollide(8).strength(.9))
    .force("charge", d3.forceManyBody().distanceMax(900).strength( -100))
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(d =>-3))
    .force("center", d3.forceCenter(width / 2, height / 2));
  }

      /* sim2 */
  function sim2() {
     return d3.forceSimulation()
     .force("center", d3.forceCenter(width / 2, height / 2))
     /* .force ("collide",d3.forceCollide(10).strength(.5))*/
     .force("charge", d3.forceManyBody().distanceMax(100).strength( function(d){
      if (d.type == "uid")
        return -4;
      return -60;
    }))
     .force("link", d3.forceLink().id(function(d) { return d.id; }));
  } 
     /* sim2 */
  function sim3() {
   return d3.forceSimulation()
   .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(0.2))
   .force("center", d3.forceCenter(width / 2, height / 2))
   .force("charge", d3.forceManyBody().strength(d => -1.5))

  } 
  function sim4() {
    return d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force ("collide",d3.forceCollide(50).strength(.5))
    .force("charge", d3.forceManyBody().strength(d => d.wt * -100))
    .force("center", d3.forceCenter(width / 2, height / 2));
  }


/** INITIALIZATION
    this will look for svg elements, pull the data attributes
    pull the correct model, apply the appropriate vis.
    **/
  function init() {
    if ((nodeSrc == null) || (linkSrc == null))
    {
      console.log("missing filepath :" + nodeSrc  +" " + linkSrc)
      return;
    }

    d3.csv(nodeSrc,function(d) { 
      nodes = d;
      d3.csv(linkSrc, function(d) {
        links = d; 
        processrelationships.apply(t);
        render.apply(t);
      }) 
    }); 
  
  }
  init();

  /****************************************
GRAPH RENDERERS
****************************************/


/** RENDER FUNCTIONS
    this function draws the lines and nodes. to allow switching,
    I'll create a set of functions for each type **/

/** ONLY ID NODES, LINES THICK BY CONNECTION TYPE
this function emphasizes the identity by scaling each id node by # listings, then linking with an appropriate  thick line.*/



/** DATA PROCESSING PUBLIC FUNCTION
    this function extracts additional information from the raw nodes
    specifically it 
    1) iterates thru and separates identity nodes from listing nodes
    2) iterates thru links and constructs weighted links between identity.
    **/

    function processrelationships () {
      
      obj_nodes = {};
      /** make a working copy so I can remove items **/
      var new_links   = {};
      for (var i = 0; i < links.length; i++)
      {  
        if (!obj_nodes[links[i].target])   /** add a new id node if none exists **/
          obj_nodes[links[i].target] = {id:links[i].target, type:"phone", listings: []};
        obj_nodes[links[i].target].listings.push(links[i].source) /* push new lising here */
      }
      for (var i = 0; i < nodes.length; i++)
        if(obj_nodes[nodes[i].id])
          obj_nodes[nodes[i].id].type = nodes[i].type ;
     

      for (var n in obj_nodes)  /* n here should be the attribute name*/
      {
        var node = obj_nodes[n]
        for (var i=0; i <  node.listings.length; i ++)
          for (var j = 0; j < links.length; j++)
          {
        /* if I see a link in the list that I connect to, 
        and its not linking to me, then link to its target.*/
        var target = links[j].target
        if ((node.listings[i] == links[j].source) /* if listing in node matches listing in links, and is not me*/
          && ( target != n))
        {
          if (new_links['o'+ n +'_'+target])
          {
            new_links['o'+ n +'_'+ target].wt ++;
            new_links['o'+ n +'_'+ target].listings.push(node.listings[i]);
          }
          if (new_links['o'+ target +'_'+ n])
          {
            new_links['o'+ target +'_'+ n].wt ++;
            new_links['o'+ target +'_'+ n].listings.push(node.listings[i]);
          }
          if ((!new_links['o'+ target +'_'+ n]) || (!new_links['o'+ n +'_'+target]))
          {
            new_links['o'+ n +'_'+target] = {
              source:   n,
              target:   links[j].target,
              wt:   1,
              listings: []
            };
            new_links['o'+ n +'_'+target].listings.push(node.listings[i])
          }
        }
      }
    }

    /* now convert new links from an object to an array of objects*/
    id_links = [];
    id_nodes = [];
    for (link in new_links) 
        id_links.push(new_links[link]);
    for (node in obj_nodes)
        id_nodes.push(obj_nodes[node]);
  }
  /** behaviors **/
  function highlight(d,i)
  {
 if (d.type == "uid") return;
    var thisnode = d.id
    var nodes_to_hide = svg.selectAll("use");
    var lines_to_hide = svg.selectAll("line");
    var associated_nodes = obj_nodes[d.id].listings;
    
        nodes_to_hide.style("opacity", function (d)
        {
            return ((associated_nodes.indexOf(d.id)!= -1)||
                    (d.id == thisnode)?"1":"0.2") 
        })

        lines_to_hide.style("display", function (d)
        {
         
          
          return ( ( associated_nodes.indexOf(d.source.id) != -1) &&
                   ( d.target.id == thisnode)? "block":"none"); 

        });  
    }
    
    

function unhighlight(d,i)
{
  if (d.type == "uid") return;
   svg.selectAll("use").style("opacity","1")
   svg.selectAll("line").style("display","block")
}



/** LISTINGS AS DOTS
    this function emphasizes the lines connecting information to 
    show how strongly different information is associated. It downplays cluster size.*/

  function render_listings_as_dots (){ 
  
  var symbols = {
      "uid":    "symbols.svg#uid_a",
      "name":   "symbols.svg#name",
      "phone":   "symbols.svg#phone",
      "email":   "symbols.svg#email"
  }
 
 console.log(simlength)
  simulation = (nodes.length > 400? sim2():sim1())

    /* visualize links */
  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("class", "line")
    .attr("opacity", d =>  "0.5")
    .style("display","none")
    .attr("stroke-width","0.2pt")

    /* create nodes */
  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("use")
    .data(nodes)
    .enter().append("use")
    .attr("href", d => symbols[d.type]) 
    .attr("width","16px")
    .attr("height","18px")
    .attr("class", d => d.type)
    /* Event handlers */
    .on("mouseover", highlight)
    .on("mouseout", unhighlight)
    




  node.append("title")
    .text(function(d) { return d.entityValue; });

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);



  function ticked() {

    extents     = { x1:10000,
                    x2:0,
                    y1:10000,
                    y2:0}
    link
      .attr("x1", function(d) { return d.source.x+8; })
      .attr("y1", function(d) { return d.source.y+8; })
      .attr("x2", function(d) { return d.target.x+8; })
      .attr("y2", function(d) { return d.target.y+8; });


    node
      .attr("x", function(d) { 

        extents.x1 = Math.min(extents.x1, d.x);
        extents.x2 = Math.max(extents.x2, d.x);
        return d.x; })
      .attr("y", function(d) { 
        extents.y1 = Math.min(extents.y1, d.x);
        extents.y2 = Math.max(extents.y2, d.x);
        return d.y; });
       /* console.log(extents)*/
    simstate ++;
     console.log(simlength > simstate)
      svg.attr("viewBox", [extents.x1 -50, 
        extents.y1-50,
        (extents.x2-extents.x1)+100,
        (extents.y2-extents.y1)+100].join (" "));
      

    if (simstate > simlength ) {
      
      simulation.stop();
      d3.selectAll("line").style("display","block")
    
    }
  }
  }

/** Renders title, %infringing etc...*/
function render_title_metadata ()
{
  svg.append("text")
  .attr("class", "title")

}

/** LISTINGS AS DOTS
    this function emphasizes the lines connecting information to 
    show how strongly different information is associated. It downplays cluster size.*/

  function render_links_between_identities (){ 
  
  var symbols = {
      "uid":    "symbols.svg#uid_a",
      "name":   "symbols.svg#name",
      "phone":   "symbols.svg#phone",
      "email":   "symbols.svg#email"
  }
 

  simulation =  sim4()
 
    /* visualize links */
  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(id_links)
    .enter().append("line")
    .attr("stroke", d => "rgba(0,0,0,0.05)")
    .attr("stroke-width", d => Math.sqrt(d.wt) + "px")
    .attr("opacity", function(d){
      var foo = d.wt / Math.sqrt(d3.max(id_links, function(d) { return d.wt; })) * 0.8;
      return foo + "";
    });
    

   var nodeWeight = d3.max(id_nodes, function (d) {return d.listings.length})

    console.log(nodes)
    console.log(id_nodes)
    /* create nodes */
  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("use")
    .data(id_nodes)
    .enter().append("use")
   /* .attr("transform", d => "scale(" + 80 * d.listings.length / nodeWeight+ ")")*/
   /* .attr("opacity", d => Math.min(1,Math.max(0.5,d.listings.length/nodeWeight)))*/
    .attr("href", d => symbols[d.type]) 
    .attr("transform", function(d) { return "translate(" + 
                (-8 - 12 * d.listings.length / nodeWeight) + ","+
                (-9 - 12 * d.listings.length / nodeWeight)+")" })
   
    .attr("width",d =>(16+ 30 *d.listings.length / nodeWeight) +"px")
    .attr("height",d =>(18+ 30 +d.listings.length / nodeWeight) +"px")
    .attr("class", d => d.type)

  node.append("title")
    .text(function(d) { return d.entityValue; });

  simulation
    .nodes(id_nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(id_links);

  function ticked() {

    extents     = { x1:10000,
                    x2:0,
                    y1:10000,
                    y2:0}
    link
      .attr("x1", function(d) { return d.source.x+8; })
      .attr("y1", function(d) { return d.source.y+8; })
      .attr("x2", function(d) { return d.target.x+8; })
      .attr("y2", function(d) { return d.target.y+8; });


    node
      .attr("x", function(d) { 

        extents.x1 = Math.min(extents.x1, d.x);
        extents.x2 = Math.max(extents.x2, d.x);
        return d.x; })
      .attr("y", function(d) { 
        extents.y1 = Math.min(extents.y1, d.x);
        extents.y2 = Math.max(extents.y2, d.x);
        return d.y; });
       /* console.log(extents)*/
    simstate ++;
      svg.attr("viewBox", [extents.x1 -50, 
        extents.y1-50,
        Math.max(500,(extents.x2-extents.x1)+100),
        Math.max(500,(extents.y2-extents.y1)+100)].join (" "));
      }

    if (simstate >= simlength ) {
      /*console.log(extents)*/
      simulation.stop();
      d3.select(".links").attr("style","display:block")
    
    }
  }




}








 var vis = []
d3.selectAll("svg")
  .each( function (d,i) {console.log(this.id); vis.push(new je_mm.clusterVis(this.id))})
 
