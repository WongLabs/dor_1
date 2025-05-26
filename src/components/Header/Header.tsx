import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SearchBar from "./Searchbar.tsx";
import AccountBar from "./AccountBar.tsx";
const Header = () => {
  return (
    <div data-testid="header-element" className="navbar bg-base-300 md:flex-row flex-col">
      <div className="flex flex-col md:flex-row justify-between w-full items-center">
        <div className="flex-none flex flex-row gap-2">
          <button className="btn btn-circle btn-ghost bg-base-100">
            <ArrowBackIosNewOutlinedIcon />
          </button>
          <button className="btn btn-circle btn-ghost bg-base-100">
            <ArrowForwardIosOutlinedIcon />
          </button>
        </div>
        <div className="justify-center flex flex-row items-center gap-2 mt-2 md:mt-0">
          <button className="btn btn-circle btn-ghost m-auto bg-base-100">
            <HomeOutlinedIcon />
          </button>
          <div className="hidden md:flex">
            <SearchBar />
          </div>
        </div>
        <div className="hidden md:flex">
          <AccountBar />
        </div>
        {/* Add a mobile menu button or similar for SearchBar and AccountBar on small screens if needed */}
        {/* For now, SearchBar and AccountBar are hidden on small screens */}
      </div>
    </div>
  );
};

export default Header;
