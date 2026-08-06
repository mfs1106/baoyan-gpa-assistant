$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('d:\systemDir\Desktop\教务系统软件\专业排名证明.doc')
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
Write-Output $text
