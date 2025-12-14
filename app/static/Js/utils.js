
async function fetchDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.log("Error fetching:");
        return;
    }
    else{
        console.log("Fetching successfully")
        return await response.json();
    }

}

function formatNumber(amount) {
  if (amount == null || isNaN(amount)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(amount));
}
