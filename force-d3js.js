
//   Heavily cribbed from:
//   d3sparql.js - utilities for visualizing SPARQL results with the D3 library
//   Web site: http://github.com/ktym/d3sparql/


var d3xquery = {
    version: "d3xquery.js version 2015-11-19",
    debug: false // set to true for showing debug information
}

//Global graph variables
var w = 1020,
h = 600,
damper = 0.1,
padding = 10,
color = d3.scale.category20c();

//find center of graph
var center = {
    x: w / 2, y: h / 2
};

//Used for "zoom" effect on bubble graph
var toggleSelected = true;

//Pass in query params and get json data
d3xquery.query = function (endpoint, graphType, eventType, itemURI, relType, callback) {
    var url = endpoint + '?graphType=' + graphType + '&eventType=' + eventType + '&itemURI=' + itemURI + '&relType=' + relType;
    var mime = "application/json";
    d3.xhr(url, mime, function (data) {
        //remove tooltip?
        //tooltip = d3.select("body").append("div").attr("class","toolTip").style("position", "absolute").style("z-index", "10").style("visibility", "hidden").style("background-color", "white").style("padding", "5px").text("a simple tooltip");
        d3.select("svg").remove();
        d3.select(".toolTip").remove();
        var json = data.responseText
        callback(JSON.parse(json))
    })
}

d3xquery.initialGraph = function (json) {
    //Now in render() function
    svg = d3.select("#graph").append("svg:svg").attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox", "0 0 " + w + " " + h).classed("svg-content-responsive", true);
    
    //Tooltip for mouseover
    tooltip = d3.select("body").append("div").attr("class", "toolTip").style("position", "absolute").style("z-index", "10").style("visibility", "hidden").style("background-color", "white").style("padding", "5px").text("a simple tooltip");
    if (itemURI !== '') {
        console.log('We are here now itemID');
        forcegraph(json);
    }
    else if (eventType !== '') {
        if(eventType === 'all') {
            bubbleGraph(json);
        }
        else {
            forcegraph(json);
        }
    }
    else if (relType !== '') {
        if(relType === 'all') {
            bubbleGraph(json);
        }
        else {
            forcegraph(json);
        }
    
    } else {
        bubbleGraph(json);
    }
};

function bubbleGraph(json) {
    console.log('bubble');
     
    var nodes =[];
    
    var data = json.data.children
    
    //Sale and range for circle radius.
    var max_amount = d3.max(data, function (d) {
        return parseInt(d.radius, 10);
    });
    radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);
    
    //Add some additional values to dataset
    data.forEach(function (d) {
        var node = {
            id: d.name,
            radius: radius_scale(parseInt(d.radius, 10)),
            name: d.name,
            value: d.radius,
            type: d.type,
            x: Math.random() * 900,
            y: Math.random() * 800
        };
        nodes.push(node);
    });
    
    //Not sure this is effective
    nodes.sort(function (a, b) {
        return b.radius - a.radius;
    });
    
    //Set up force graph
    var force = d3.layout.force().nodes(nodes).gravity(0.01).charge(function (d) {
        return - Math.pow(d.radius, 2.0) / 8;
    }).friction(0.9).on("tick", tick).start();
    
    //Add circles for each data point
    var circles = svg.selectAll("circle").data(nodes).enter().append("circle")
        .attr("r", 0).attr("fill", function (d) {
            return color(d.name);
        }).attr("stroke-width", 2).attr("stroke", function (d) {
            return d3.rgb(color(d.name)).darker();
        }).attr("id", function (d) {
            return "bubble_" + d.name;
        }).attr("class", "bubble"
         ).on("mouseover", function (d) {
            tooltip.text(d.name + ' (' + d.value + ')').style("top", (d3.event.pageY) + "px").style("left", (d3.event.pageX) + "px");
            return tooltip.style("visibility", "visible");
        }).on("click", function (d) {
            if (toggleSelected == true) {
                updateChart(d.id, d.type);
                fade(d.id, 0);
                toggleSelected = false;
            } else {
                toggleSelected = true;
                unfade(d.id, 1);
            }
        }).call(force.drag);
    
    //Expanding circles effect
    circles.transition().duration(2000).attr("r", function (d) {
        return d.radius;
    });
    
    //Tick function to position circles
    function tick(e) {
        circles.each(move_towards_center(e.alpha)).each(collide(e.alpha)).attr("cx", function (d) {
            return d.x = Math.max(d.radius, Math.min(w - d.radius, d.x));
        }).attr("cy", function (d) {
            return d.y = Math.max(d.radius, Math.min(h - d.radius, d.y));
        });
    }
    
    //Fade and expand selected circle
    function fade(c, opacity) {
        svg.selectAll("circle").filter(function (d) {
            return d.id != c;
        }).transition().remove();
        svg.selectAll("circle").filter(function (d) {
            return d.id == c;
        }).transition().duration(2000).attr("r", function (d) {
            return w / 4;
        }).attr("cx", function (d) {
            return center.x;
        }).attr("cy", function (d) {
            return center.y;
        }).attr('fill-opacity', '.1');
    }
    
    function unfade(c, opacity) {
        svg.selectAll("circle").filter(function (d) {
            return d.id == c;
        }).transition().duration(2000).attr("r", 0).attr("cx", function (d) {
            return center.x;
        }).attr("cy", function (d) {
            return center.y;
        }).attr('fill-opacity', '1');
        //.on('mousedown.drag', null);
        d3.selectAll(".forceNode").remove();
        bubbleGraph(json)
    }
    //Move circles toward the center of the svg container
    function move_towards_center(alpha) {
        return function (d) {
            d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
            d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
        };
    }
    
    // Resolve collisions between nodes.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function (d) {
            var r = d.radius + radius_scale.domain()[1] + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
            quadtree.visit(function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + padding;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }
};

function forcegraph(json) {
    //Var for edges
    var edges =[];
    
    //Relationship is mapped to type in edges.
        //NOTE: may want to change that when I have a better grip on d3js
        json.links.forEach(function (e) {
            var sourceNode = json.nodes.filter(function (n) {
                return n.id === e.source;
            })[0],
            targetNode = json.nodes.filter(function (n) {
                return n.id === e.target;
            })[0];
            
            edges.push({
                source: sourceNode,
                target: targetNode,
                type: e.relationship
            });
        });
        
        //Add rectangle to sv  Should this happen here? or will this trigger multiple svg rectangles
        //svg.append("svg:rect").attr("width", w).attr("height", h).style("stroke", "#000").style("fill", "#fff");
        
        //Set force graph variables
        var force = d3.layout.force().nodes(json.nodes).links(edges).size([w, h]).linkDistance([150]).charge([-500]).theta(0.1).gravity(0.05).start();
        
        //Add links for relationships
        var link = svg.selectAll("line").data(force.links()).enter().append("svg:line").attr("class", "link forceNode").attr("id", function (d, i) {
            return 'edge' + i
        }).style("stroke", "#ccc").call(force.drag);
        
        //Add svg:g to group nodes and nodelabels
        var node = svg.selectAll(".node").data(force.nodes()).enter().append("svg:g").call(force.drag);
        
        //Add circles to group
        var circle = node.append("svg:circle").attr("r", function (d) {
            return (d.weight * .5) + 6
        }).attr("class", "forceNode").style("fill", function (d) {
            return color(d.type);
        }).style("stroke", function (d) {
            return d3.rgb(color(d.type)).darker();
        }).on("click", function (d) {
            getNodeInfo(d.id);
        }).on("mouseover", function (d) {
            d3.select(this).attr("r", function (d) {
                return (d.weight * .75) + 15
            });
        }).on("mouseout", function (d) {
            d3.select(this).attr("r", function (d) {
                return (d.weight * .5) + 6
            });
        }).call(force.drag);
        
        var nodelabels = node.append("svg:text").attr({
            "x": function (d) {
                return d.x - 20;
            },
            "y": function (d) {
                return d.y - 10;
            },
            "class": "nodelabel forceNode",
            "stroke": "#666666"
        }).text(function (d) {
            return d.name;
        });
        
        var edgepaths = svg.selectAll(".edgepath").data(edges).enter().append('svg:path').attr({
            'd': function (d) {
                return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
            },
            'class': 'edgepath forceNode',
            'fill-opacity': 0,
            'stroke-opacity': 0,
            'fill': 'blue',
            'stroke': 'red',
            'id': function (d, i) {
                return 'edgepath' + i
            }
        }).style("pointer-events", "none");
        
        var edgelabels = svg.selectAll(".edgelabel").data(edges).enter().append('svg:text').style("pointer-events", "none").attr({
            'class': 'edgelabel forceNode',
            'id': function (d, i) {
                return 'edgelabel' + i
            },
            'dx': 50,
            'dy': 0,
            'font-size': 10,
            'fill': '#aaa'
        });
        
        edgelabels.append('svg:textPath').attr('xlink:href', function (d, i) {
            return '#edgepath' + i
        }).style("pointer-events", "none").text(function (d, i) {
            return d.type
        });
        
        //Connecting linked nodes on click
        node.on("mouseover", fade(.1));
        node.on("mouseout", fade(1));
        var linkedByIndex = {
        };
        
        edges.forEach(function (d) {
            linkedByIndex[d.source.index + "," + d.target.index] = 1;
        });
        
        function isConnected(a, b) {
            return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
        }
        
        function neighboring(a, b) {
            return edges.some(function (d) {
                return (d.source === a && d.target === b) || (d.source === b && d.target === a) ? d.type: d.type;
            });
        }
        
        //Highlight related
        function fade(opacity) {
            return function (d) {
                node.style("stroke-opacity", function (o) {
                    thisOpacity = isConnected(d, o) ? 1: opacity;
                    this.setAttribute('fill-opacity', thisOpacity);
                    return thisOpacity;
                    return isConnected(d, o);
                });
                
                link.style("stroke-opacity", opacity).style("stroke-opacity", function (o) {
                    return o.source === d || o.target === d ? 1: opacity;
                });
                
                edgelabels.style("fill-opacity", opacity).style("fill-opacity", function (o) {
                    return o.source === d || o.target === d ? 1: opacity;
                });
            };
        };
        
        //Return names and descriptions
        //Trying to get relationships
        function getNodeInfo(uri) {
            $.get("get-names.xql", {
                id: uri
            }).done(function (data) {
                $("#info-box").html(data);
            });
        }
        
        
        force.on("tick", function () {
            circle.attr("cx", function (d) {
                return d.x = Math.max(15, Math.min(w - 15, d.x));
            }).attr("cy", function (d) {
                return d.y = Math.max(15, Math.min(h - 15, d.y));
            });
            node.attr("cx", function (d) {
                return d.x = Math.max(15, Math.min(w - 15, d.x));
            }).attr("cy", function (d) {
                return d.y = Math.max(15, Math.min(h - 15, d.y));
            });
            
            link.attr({
                "x1": function (d) {
                    return d.source.x;
                },
                "y1": function (d) {
                    return d.source.y;
                },
                "x2": function (d) {
                    return d.target.x;
                },
                "y2": function (d) {
                    return d.target.y;
                }
            });
            
            nodelabels.attr("x", function (d) {
                return d.x + 10;
            }).attr("y", function (d) {
                return d.y;
            });
            
            edgepaths.attr('d', function (d) {
                var path = 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
                //console.log(d)
                return path
            });
            
            edgelabels.attr('transform', function (d, i) {
                if (d.target.x < d.source.x) {
                    bbox = this.getBBox();
                    rx = bbox.x + bbox.width / 2;
                    ry = bbox.y + bbox.height / 2;
                    return 'rotate(180 ' + rx + ' ' + ry + ')';
                } else {
                    return 'rotate(0)';
                }
            });
        });

//Create filter based on type
    createFilter();
    // Method to create the filter, generate checkbox options on fly
    // force.links()
    //unique links: http://stackoverflow.com/questions/28572015/how-to-select-unique-values-in-d3-js-from-data
    //use d3.map to get unique values from data
    function createFilter() {
              d3.select(".filterContainer").selectAll("div")
                .data(d3.map(edges, function(d){return d.type;}).keys())
                .enter()  
                .append("div")
                .attr("class", "checkbox-container")
                .append("label")
                .each(function (d) {
                       d3.select(this).append("svg:rect")
                            .attr("width", 10)
                            .attr("height", 10)
                      // create checkbox for each data
                      d3.select(this).append("input")
                        .attr("type", "checkbox")
                        .attr("id", function (d) {
                            return "chk_" + d;
                         })
                         .attr("class", function (d) {
                            return "chk " + d;
                         })
                        .attr("checked", true)
                        .on("click", function (d, i) {
                            // register on click event
                            var lVisibility = this.checked ? "visible" : "hidden";
                            filterGraph(d, lVisibility);
                         })
                      d3.select(this).append("span")
                          .text(function (d) {
                              return d;
                          });
              });
              $("#sidebar").show();
              console.log(d3.map(force.links, function(d){return d.type;}).keys());
          }
          
    function filterGraph(aType, aVisibility) {
            // change the visibility of the connection path
            link.style("visibility", function (o) {
                var lOriginalVisibility = $(this).css("visibility");
                return o.type === aType ? aVisibility : lOriginalVisibility;
            });
            
            edgelabels.style("visibility", function (o) {
                var lOriginalVisibility = $(this).css("visibility");
                return o.type === aType ? aVisibility : lOriginalVisibility;
            });
    
            // change the visibility of the node
            // if all the links with that node are invisibile, the node should also be invisible
            // otherwise if any link related to that node is visibile, the node should be visible
            node.style("visibility", function (o, i) {
                var lHideNode = true;
                link.each(function (d, i) {
                    if (d.source === o || d.target === o) {
                        if ($(this).css("visibility") === "visible") {
                            lHideNode = false;
                            // we need show the text for this circle
                            d3.select(d3.selectAll(".nodeText")[0][i]).style("visibility", "visible");
                            return "visible";
                        }
                    }
                });
                
                if (lHideNode) {
                    // we need hide the text for this circle 
                    d3.select(d3.selectAll(".nodeText")[0][i]).style("visibility", "hidden");
                    return "hidden";
                }
            });
        }


};

function updateChart(id, type){
    var url = 'get-relationships.xql' + '?graphType=' + type + '&eventType=' + id + '&relType=' + id
    d3.json(url, function (json) {
        forcegraph(json)
    });
};