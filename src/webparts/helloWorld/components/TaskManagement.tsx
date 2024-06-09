import React, { useEffect } from "react";

import { useState } from "react";
import './TaskManagement.css'
import { Web } from "sp-pnp-js";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

//.......here am declare the dataType all the variable
interface Person {
  Id: number;
  Title: string;
  Parent?: {
    Title: string;
  };
  portfolioTitle:string;
  ItemType: string;
  PortfolioStructuredId: string;
  children: Person[];
}





const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("Id", {
    header: (props) => (
      <button onClick={props.table.getToggleAllRowsExpandedHandler()}>
        {props.table.getIsAllRowsExpanded() ? "👇" : "👉"}
      </button>
    ),
    cell: (props) => {
     
      return (
        <div style={{ paddingLeft: `${props.row.depth * 2}rem` }}>
          {props.row.getCanExpand() ? (
            <button
              style={{ cursor: "pointer" }}
              onClick={props.row.getToggleExpandedHandler()}
            >
              {props.row.getIsExpanded() ? "👇" : "👉"}
            </button>
          ) : (
            "🔵"
          )}
          {props.getValue()}
        </div>
      );
    },
  }),


  columnHelper.accessor("Title", {
    header: "Task Name",
  }),
  columnHelper.accessor("portfolioTitle", {
    header: "Parent",
  }),
  columnHelper.accessor("ItemType", {
    header: "ItemType",
  }),
  columnHelper.accessor("PortfolioStructuredId", {
    header: "PortfolioStructureID",
  }),
];


const TaskManagement = () => {
  const [data, setData] = useState<Person[]>([]);

  const [expanded, setExpanded] = useState({});

  const[columnFilters,setColumnFilters]=useState([])

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
      columnFilters
    },
    
    getSubRows: (row) => row.children,
    onColumnFiltersChange:setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFromLeafRows:true
  });
    console.log("Column Filters",columnFilters)

    useEffect(() => {
      getData();
    }, [columnFilters]);
  //here we fetch the data from the sharepoint list  

  const getData = async () => {
    try {
      const web = new Web(
        "https://smalsusinfolabs.sharepoint.com/sites/Portal/DevSharma"
      );
      const dta = await web.lists
        .getById("491e1123-a75c-46e8-b4b9-803ed9f6e374")
        .items.select(
          "Id",
          "Title",
          "Parent/Title",
          "ItemType",
          "PortfolioStructuredId"
        )
        .expand("Parent")
        .get();

//here we modify the object(data) for serching  in parent column----
     dta?.map((item:any)=>{
      item.portfolioTitle=" "
      if(item.Parent){
        item.portfolioTitle=item.Parent.Title
      }
     })


      const data = dta as Person[];
      const hierarchy = buildHierarchy(data);
//here we set the state  
      setData(hierarchy);
    } catch (error) 
    {
      console.log("your errors", error);
    }
  };


  
//--------here we create a herarchy in data for apply grouping------------
  const buildHierarchy = (data: Person[]):Person[] => {
    const itemsMap = new Map<number, Person>();
    const roots: Person[] = [];

    data?.forEach((item) => {
      itemsMap.set(item.Id, { ...item, children: [] });
      if (item.Parent) {
        const parentItem = Array.from(itemsMap.values()).find(
          (valueItem) => valueItem.Title === item?.Parent?.Title
        );
        if (parentItem) {
          parentItem.children.push(itemsMap.get(item.Id)!);
        }
      } else {
        roots.push(itemsMap.get(item.Id)!);
      }
    });

    return roots;
  };


  return (
    <>
      <table className="table table-striped">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
               
                    <span>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  </span>
               {header.id !== "Id" &&(
                    <input
                      type="text"
                      onChange={e => header.column.setFilterValue(e.target.value)}
                      style={{ width: '130px' }}
                      placeholder={`search ${flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr className={`depth-${row.depth}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell?.column?.columnDef?.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>



      <div className="flex items-center gap-2">
        <div className="button">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="border "
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="border "
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
         </div>
        
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
        
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[5, 10, 15, 20, 25].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default TaskManagement;
