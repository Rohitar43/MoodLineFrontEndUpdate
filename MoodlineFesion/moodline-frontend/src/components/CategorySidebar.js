import React from "react";

function CategorySidebar({categories,selected,setSelected}){

return(

<div className="sidebar">

<h3>Categories</h3>

<ul>

<li
className={!selected ? "active" : ""}
onClick={()=>setSelected(null)}
>
All
</li>

{categories.map(c=>(
<li
key={c.id}
className={selected === c.id ? "active" : ""}
onClick={()=>setSelected(c.id)}
>
{c.name}
</li>
))}

</ul>

</div>

);

}

export default CategorySidebar;