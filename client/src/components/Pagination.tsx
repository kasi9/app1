
import React, { useEffect, useState } from "react";

interface PaginationProps {
    totalPages?: number;                 
    currentPage?: number;    
    onPageNoChange: (page: number) => void;            
}

const Pagination : React.FC<PaginationProps> = ({ totalPages = 1, currentPage = 1, onPageNoChange}) => {

    const [pageNos, setPageNos] = useState<number[]>([]);

    useEffect( () => {
   
        let pages : number[] = [] ;

        pages.push(1);
        
        for(let i=(currentPage-3); i<currentPage; i++){       
          if (i>1) 
              pages.push(i);
        }

        if (!pages.includes(currentPage))
          pages.push(currentPage);

        for(let i=currentPage+1; (i<(currentPage+3+1) && i<totalPages); i++){
          pages.push(i);
        }

        if (totalPages>0 && !pages.includes(totalPages))
          pages.push(totalPages);

        setPageNos(pages);
    }, [currentPage, totalPages]);

    return (

  <tr>
    <td colSpan={5}>
      <ul className="flex gap-2">
        {
        pageNos.map((page) => 
            currentPage==page ? ( <div key={page} className="bg-yellow-600 text-white mx-2"><button key={page} className="mx-2" >{page}</button></div> ) 
              : ( <div key={page} onClick={()=>onPageNoChange(page)} className="bg-blue-600 text-white"><button key={page} className="mx-2">{page}</button></div> ) 
        )}
      </ul>
    </td>
  </tr>   
       
    )
}

export default Pagination ;
