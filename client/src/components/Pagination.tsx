
import React, { useEffect, useState } from "react";

interface PaginationProps {
    totalPages?: number;                 
    currentPage?: number;    
    onPageNoChange: (page: number) => void;            
}

const Pagination : React.FC<PaginationProps> = ({ totalPages = 1, currentPage = 1, onPageNoChange}) => {

    const [pageNos, setPageNos] = useState<number[]>([]);

    useEffect( () => {
   
        const pages : number[] = [] ;

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

  <>
  {
  pageNos.map((page) => 
      currentPage==page ? ( <button key={page} className="bg-yellow-600 text-white mx-2 w-10 flex">{page}</button> ) 
        : ( <button key={page} onClick={()=>onPageNoChange(page)} className="bg-blue-600 text-white w-10 flex">{page}</button> ) 
  )}

  </>   
       
    )
}

export default Pagination ;
