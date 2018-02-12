xquery version "3.1";

import module namespace d3xquery="http://syriaca.org/d3xquery" at "d3xquery.xqm";

declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace json="http://www.json.org";

declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";

declare variable $id {request:get-parameter('id', '')};
declare variable $record {request:get-parameter('recordID', '')};
declare variable $type {request:get-parameter('type', '')};
declare variable $relationship {request:get-parameter('relationship', '')};
declare variable $collectionPath {request:get-parameter('collection', '')}; 

declare function local:get-relationship($relationship, $id){
    let $id := concat($id,'(\W.*)?$')
    return 
        if($all-relationships = false()) then
            if($id != '') then
                collection($collection)//tei:relation[@ref=$relationship][@passive[matches(.,$id)] or 
                    @active[matches(.,$id)] or
                    @mutual[matches(.,$id)]]
            else collection($collection)//tei:relation[@ref=$relationship]
        else if($id != '') then
                collection($collection)//tei:relation[@passive[matches(.,$id)] or 
                    @active[matches(.,$id)] or
                    @mutual[matches(.,$id)]]
        else collection($collection)//tei:relation
};

let $records :=
            if($record != '') then
                    if(contains($record,'/spear/')) then 
                        let $rec := collection('/db/apps/srophe-data/data/spear')//tei:div[@uri = $record]
                        let $teiHeader := root($rec)//tei:teiHeader
                        return 
                            <tei:TEI xmlns="http://www.tei-c.org/ns/1.0">{($teiHeader,$rec)}</tei:TEI>
                    else     
                        collection('/db/apps/srophe-data/data/')/tei:TEI[.//tei:idno[@type='URI'][. = concat($record,'/tei')]][1]
            (: Return a collection:)
            else if($collectionPath != '') then 
                collection(string($collectionPath))
            (: Return a single TEI record:)     
            else collection('/db/apps/srophe-data/data/spear')  
return d3xquery:build-graph-type($records, $id, $relationship, $type)          
