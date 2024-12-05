import pandas as pd
import io
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

def collect_vault_data():
    query = gql("""
    query ExampleQuery($timeframe: String!, $address: String!) {
    vaultRates(timeframe: $timeframe, address: $address) {
        rewardROI
        roiChangePercentage
        roiPercentage
        timeframe
        history {
        value
        timestamp
        }
    }
    }
    """)

    variables = {
    "address": "0:e926764ff3d272c73ddeb836975c5521c025ad68e7919a25094e2de3198805f1",
    "timeframe": "03/12/2024",
    }

    transport = RequestsHTTPTransport(
        url="https://api5.storm.tg/graphql",
        use_json=True,
    )

    client = Client(transport=transport, fetch_schema_from_transport=True)

    response = client.execute(query, variable_values=variables)

    history = response['vaultRates']['history']

    csv_buffer = io.StringIO()
    csv_buffer.write("Value,Date\n")
    for entry in history:
        csv_buffer.write(f"{entry['value']},{entry['timestamp']}\n")

    csv_buffer.seek(0)

    df = pd.read_csv(csv_buffer, names=["Value", "Date"], skiprows=1)

    print(df)

if __name__ == "main":
    collect_vault_data()