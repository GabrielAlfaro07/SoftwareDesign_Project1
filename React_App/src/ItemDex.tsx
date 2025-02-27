import { useState, useEffect } from "react";
import ItemCard from "./components/ItemCard";
import SearchBar from "./components/SearchBar";
import PaginationButtons from "./components/PaginationButtons";
import CategoryDropdown from "./components/CategoryDropdown";
import AccountButton from "./components/AccountButton";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";

interface Item {
  name: string;
  url: string;
}

interface ItemCategory {
  category: {
    name: string;
    url: string;
  };
}

interface ItemDetails {
  id: number;
  sprites: {
    default: string;
  };
  category: ItemCategory;
}

const PAGE_SIZE = 100;

const ItemDex = () => {
  const navigate = useNavigate(); // Inicializa el hook useNavigate
  // Función para manejar el clic en un ítem
  const handleItemClick = (item: Item, details: ItemDetails) => {
    navigate("/itemdetails", { state: { item, details } });
  };
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
  const [itemDetails, setItemDetails] = useState<{
    [name: string]: ItemDetails;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [previousPage, setPreviousPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isDarkTheme } = useTheme();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    updateDisplayedItems();
  }, [currentPage, searchQuery, allItems, selectedCategory]);

  useEffect(() => {
    fetchItemDetails();
  }, [allItems]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://pokeapi.co/api/v2/item?offset=0&limit=100000"
      );
      if (!response.ok) throw new Error("Failed to fetch item data.");
      const data = await response.json();
      setAllItems(data.results);
      setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch (error) {
      setError(error.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async () => {
    for (const item of allItems) {
      if (!itemDetails[item.name]) {
        try {
          const response = await fetch(item.url);
          if (!response.ok)
            throw new Error(`Failed to fetch details for ${item.name}`);
          const data: ItemDetails = await response.json();
          setItemDetails((prevDetails) => ({
            ...prevDetails,
            [item.name]: data,
          }));
        } catch (error) {
          console.error(
            `Error fetching details for ${item.name}: ${error.message}`
          );
          setItemDetails((prevDetails) => ({
            ...prevDetails,
            [item.name]: {
              id: -1,
              sprites: { default: "" },
              category: { category: { name: "Unknown", url: "#" } },
            },
          }));
        }
      }
    }
  };

  const updateDisplayedItems = () => {
    const filteredItems = allItems.filter((item) => {
      const itemDetail = itemDetails[item.name];
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? itemDetail?.category?.name === selectedCategory
        : true;

      return matchesSearch && matchesCategory;
    });

    setTotalPages(Math.ceil(filteredItems.length / PAGE_SIZE));

    const offset = currentPage * PAGE_SIZE;
    const paginatedItems = filteredItems.slice(offset, offset + PAGE_SIZE);
    setDisplayedItems(paginatedItems);
  };

  const handleSearch = (query: string) => {
    if (query !== "") {
      if (!isSearching) {
        setPreviousPage(currentPage);
        setCurrentPage(0);
      }
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setCurrentPage(previousPage);
    }
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="ItemDex bg-green-400 text-white flex flex-col min-h-screen p-4">
      <header
        className={`${
          isDarkTheme ? "bg-gray-800 text-white" : "bg-white text-black"
        } transition-all duration-300 text-center text-xl p-4 rounded-full mb-4 flex justify-between items-center`}
      >
        {" "}
        <h1 className="text-2xl m-0">ItemDex</h1>
        <div className="flex items-center space-x-4">
          <CategoryDropdown
            selectedCategory={selectedCategory}
            onChange={handleCategoryChange}
          />
          <SearchBar searchQuery={searchQuery} setSearchQuery={handleSearch} />
          <AccountButton />
        </div>
      </header>
      <div
        className={`${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        } transition-all duration-300 p-4 rounded-2xl flex-grow overflow-auto`}
      >
        <div
          className={`p-4 ${
            isDarkTheme ? "text-white" : "text-black"
          } transition-all duration-300 text-center`}
        >
          <h2 className="text-4xl font-bold">ItemDex</h2>
          <p className="mt-4 text-lg">
            La ItemDex es una enciclopedia virtual que acoge información sobre
            todos los Items que existen en el mundo Pokémon.
          </p>
          <p className="mb-4 text-lg">
            Aquí puedes buscar información sobre el Ítem que desees.
          </p>
        </div>
        <PaginationButtons
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => setCurrentPage(newPage)}
        />
        {displayedItems.length === 0 ? (
          <div>No items found</div>
        ) : (
          <div className="item-grid grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 p-5">
            {displayedItems.map((item, index) => {
              const details = itemDetails[item.name];
              return (
                <div key={index} className="item-item flex justify-center">
                  {details && details.id !== -1 ? (
                    <ItemCard item={item} details={details} />
                  ) : (
                    <div className="bg-gray-200 text-gray-500 p-4 rounded-xl">
                      <p>Details not available for {item.name}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDex;
