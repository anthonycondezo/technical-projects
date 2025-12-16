
#n-loopback IPv4 address from Wi-Fi or Ethernet
$ip = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object {$_.IPAddress -like '192.168.*' -and $_.InterfaceAlias -match "Wi-Fi"}).IPAddress

if (-not $ip) {
    Write-Host "Could not detect LAN IP. Make sure you are connected to Wi-Fi or Ethernet."
    exit 1
}
echo "IPv4 address for base url is: $ip"



